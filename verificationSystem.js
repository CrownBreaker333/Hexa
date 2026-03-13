const crypto = require('crypto');

class VerificationSystem {
    constructor() {
        this.activeChallenges = new Map();
        this.completedVerifications = new Map();
        this.CHALLENGE_TIMEOUT = 5 * 60 * 1000;
        this.DM_CODE_TIMEOUT = 5 * 60 * 1000;
    }

    generateMathChallenge() {
        const challengeId = crypto.randomBytes(16).toString('hex');
        const num1 = Math.floor(Math.random() * 20) + 1;
        const num2 = Math.floor(Math.random() * 20) + 1;
        const correctAnswer = num1 + num2;

        const challenge = {
            challengeId,
            num1,
            num2,
            question: `${num1} + ${num2}`,
            correctAnswer,
            attempts: 0,
            createdAt: Date.now(),
            expiresAt: Date.now() + this.CHALLENGE_TIMEOUT,
            userId: null,
            guildId: null
        };

        this.activeChallenges.set(challengeId, challenge);
        console.log(`[MATH] New challenge: ${num1} + ${num2} = ${correctAnswer}`);

        return { challengeId, question: challenge.question };
    }

    setUserForChallenge(challengeId, userId, guildId) {
        const challenge = this.activeChallenges.get(challengeId);
        if (challenge) {
            challenge.userId = userId;
            challenge.guildId = guildId;
            console.log(`[MATH] Challenge ${challengeId} assigned to user ${userId}`);
        }
    }

    verifyMathAnswer(challengeId, userAnswer) {
        const challenge = this.activeChallenges.get(challengeId);
        
        if (!challenge) {
            console.log(`[MATH] Challenge not found: ${challengeId}`);
            console.log(`[MATH] Available challenges: ${Array.from(this.activeChallenges.keys()).slice(0, 3)}`);
            return { success: false, reason: 'Challenge not found' };
        }

        if (Date.now() > challenge.expiresAt) {
            this.activeChallenges.delete(challengeId);
            return { success: false, reason: 'Challenge expired' };
        }

        challenge.attempts++;
        const answer = parseInt(userAnswer.trim());

        console.log(`[MATH] Attempt ${challenge.attempts}/3: User answer=${answer}, Correct=${challenge.correctAnswer}`);

        if (isNaN(answer)) {
            return { success: false, reason: 'Invalid answer', attempts: challenge.attempts };
        }

        if (answer !== challenge.correctAnswer) {
            if (challenge.attempts >= 3) {
                this.activeChallenges.delete(challengeId);
                return { success: false, reason: 'Too many wrong attempts' };
            }
            return { success: false, reason: 'Wrong answer', attempts: challenge.attempts };
        }

        console.log(`[MATH] CORRECT! Deleting challenge.`);
        this.activeChallenges.delete(challengeId);
        
        return { 
            success: true, 
            userId: challenge.userId,
            guildId: challenge.guildId
        };
    }

    generateDMCode(userId, guildId) {
        const code = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 8);
        const codeId = crypto.randomBytes(16).toString('hex');
        const expiresAt = Date.now() + this.DM_CODE_TIMEOUT;

        this.completedVerifications.set(codeId, {
            codeId,
            code,
            userId,
            guildId,
            used: false,
            expiresAt,
            createdAt: Date.now()
        });

        console.log(`[OTP] Generated code: ${code} for user ${userId}`);
        return { code, codeId, expiresAt };
    }

    verifyDMCode(codeId, code, userId) {
        const verification = this.completedVerifications.get(codeId);

        if (!verification) {
            return { success: false, reason: 'Code not found' };
        }

        if (verification.used) {
            return { success: false, reason: 'Code already used' };
        }

        if (Date.now() > verification.expiresAt) {
            this.completedVerifications.delete(codeId);
            return { success: false, reason: 'Code expired' };
        }

        if (verification.code !== code) {
            return { success: false, reason: 'Invalid code' };
        }

        if (verification.userId !== userId) {
            return { success: false, reason: 'Code not for this user' };
        }

        verification.used = true;
        return {
            success: true,
            userId: verification.userId,
            guildId: verification.guildId
        };
    }

    cleanupExpired() {
        const now = Date.now();

        for (const [id, challenge] of this.activeChallenges) {
            if (now > challenge.expiresAt) {
                this.activeChallenges.delete(id);
            }
        }

        for (const [id, verification] of this.completedVerifications) {
            if (now > verification.expiresAt) {
                this.completedVerifications.delete(id);
            }
        }
    }
}

module.exports = new VerificationSystem();