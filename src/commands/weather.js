const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weather')
        .setDescription('Advanced global weather for any location')
        .addStringOption(option =>
            option.setName('location')
                .setDescription('City or address')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('units')
                .setDescription('Temperature units')
                .setRequired(false)
                .addChoices(
                    { name: 'Celsius', value: 'celsius' },
                    { name: 'Fahrenheit', value: 'fahrenheit' }
                )
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const location = interaction.options.getString('location');
        const units = interaction.options.getString('units') || 'celsius';
        const isCelsius = units === 'celsius';

        try {
            const geoResponse = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
            );
            const geoData = await geoResponse.json();

            if (!geoData.results || geoData.results.length === 0) {
                return interaction.editReply(`Location not found. Try another name.`);
            }

            const loc = geoData.results[0];
            const { latitude, longitude, name, country, timezone, admin1, admin2 } = loc;

            let displayLocation = name;
            if (admin2) displayLocation += `, ${admin2}`;
            if (admin1 && admin1 !== admin2) displayLocation += `, ${admin1}`;
            displayLocation += `, ${country}`;

            const weatherResponse = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,precipitation,visibility,uv_index,pressure_msl&daily=sunrise,sunset,uv_index_max,precipitation_sum,weather_code,wind_speed_10m_max,temperature_2m_max&temperature_unit=${isCelsius ? 'celsius' : 'fahrenheit'}&wind_speed_unit=kmh&timezone=${timezone}`
            );
            const weatherData = await weatherResponse.json();
            const current = weatherData.current;
            const daily = weatherData.daily;

            if (!current || !daily) {
                return interaction.editReply('Failed to fetch weather data.');
            }

            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: timezone,
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
            const timeStr = formatter.format(new Date());

            const sunriseTime = daily.sunrise[0].split('T')[1];
            const sunsetTime = daily.sunset[0].split('T')[1];

            const weatherCodes = {
                0: 'Clear',
                1: 'Mainly Clear',
                2: 'Partly Cloudy',
                3: 'Overcast',
                45: 'Foggy',
                48: 'Foggy',
                51: 'Light Drizzle',
                53: 'Moderate Drizzle',
                55: 'Heavy Drizzle',
                61: 'Slight Rain',
                63: 'Moderate Rain',
                65: 'Heavy Rain',
                71: 'Slight Snow',
                73: 'Moderate Snow',
                75: 'Heavy Snow',
                77: 'Snow Grains',
                80: 'Rain Showers',
                81: 'Heavy Showers',
                82: 'Violent Showers',
                85: 'Snow Showers',
                86: 'Heavy Snow Showers',
                95: 'Thunderstorm',
                96: 'Thunderstorm w/ Hail',
                99: 'Thunderstorm w/ Hail'
            };

            const condition = weatherCodes[current.weather_code] || 'Unknown';

            const temp = current.temperature_2m;
            const windSpeed = current.wind_speed_10m;
            let windChill = temp;
            if (windSpeed > 0) {
                windChill = (13.12 + 0.6215 * temp - 11.37 * Math.pow(windSpeed, 0.16) + 0.3965 * temp * Math.pow(windSpeed, 0.16)).toFixed(1);
            }

            let embedColor = 0x36393F;
            if (temp > 30) embedColor = 0xFF6B6B;
            else if (temp > 20) embedColor = 0xFFD700;
            else if (temp > 10) embedColor = 0x4A90E2;
            else if (temp > 0) embedColor = 0x87CEEB;
            else embedColor = 0x4169E1;

            const coordsDisplay = `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;

            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle(`Weather in ${displayLocation}`)
                .setDescription(`${condition} - ${temp}°${isCelsius ? 'C' : 'F'}`)
                .addFields(
                    { name: 'Coordinates', value: coordsDisplay, inline: true },
                    { name: 'Local Time', value: `${timeStr} (${timezone})`, inline: true },
                    { name: 'Temperature', value: `${temp}°${isCelsius ? 'C' : 'F'} (Feels like ${current.apparent_temperature}°${isCelsius ? 'C' : 'F'})`, inline: false },
                    { name: 'Wind Chill', value: `${windChill}°${isCelsius ? 'C' : 'F'}`, inline: true },
                    { name: 'Wind', value: `${current.wind_speed_10m} km/h (${current.wind_direction_10m}°)`, inline: true },
                    { name: 'Humidity', value: `${current.relative_humidity_2m}%`, inline: true },
                    { name: 'Visibility', value: `${(current.visibility / 1000).toFixed(1)} km`, inline: true },
                    { name: 'Precipitation', value: `${current.precipitation} mm`, inline: true },
                    { name: 'UV Index', value: `${current.uv_index.toFixed(1)} ${getUVRisk(current.uv_index)}`, inline: true },
                    { name: 'Pressure', value: `${current.pressure_msl.toFixed(1)} mb`, inline: true },
                    { name: 'Sunrise', value: sunriseTime, inline: true },
                    { name: 'Sunset', value: sunsetTime, inline: true },
                    { name: 'Today High', value: `${daily.temperature_2m_max ? daily.temperature_2m_max[0] : 'N/A'}°${isCelsius ? 'C' : 'F'}`, inline: true }
                )
                .setFooter({ text: 'Advanced Global Weather - 100% Real-time Data' });

            interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Weather error:', error);
            interaction.editReply('Failed to fetch weather data. Try again.');
        }
    }
};

function getUVRisk(uvIndex) {
    if (uvIndex < 3) return '(Low)';
    if (uvIndex < 6) return '(Moderate)';
    if (uvIndex < 8) return '(High)';
    if (uvIndex < 11) return '(Very High)';
    return '(Extreme)';
}