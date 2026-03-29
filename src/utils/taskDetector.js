// TASK DETECTION
// Intelligently detects task type for optimal model routing

function detectTaskType(prompt) {
    const lower = prompt.toLowerCase();

    // CODING DETECTION
    const codingPatterns = [
        'code', 'debug', 'function', 'class', 'implement', 'api', 'npm', 'git',
        'javascript', 'python', 'java', 'typescript', 'sql', 'regex', 'error',
        'syntax', 'variable', 'loop', 'array', 'object', 'method', 'return',
        'console', 'print', 'library', 'framework', 'react', 'node', 'express',
        'database', 'backend', 'frontend', 'html', 'css', 'bug', 'fix',
        'refactor', 'optimize', 'algorithm', 'data structure'
    ];

    // VISION DETECTION
    const visionPatterns = [
        'image', 'picture', 'photo', 'visual', 'describe', 'see', 'look',
        'screenshot', 'diagram', 'chart', 'graph', 'video', 'frame',
        'color', 'scene', 'object', 'person', 'analyze image', 'draw'
    ];

    // REASONING DETECTION
    const reasoningPatterns = [
        'explain', 'analyze', 'why', 'how', 'prove', 'complex', 'step by step',
        'calculate', 'solve', 'break down', 'logic', 'philosophy', 'science',
        'math', 'physics', 'chemistry', 'biology', 'economics', 'reasoning',
        'deeply', 'thoroughly', 'detailed', 'comprehensive', 'difficult'
    ];

    // SIMPLE DETECTION
    const simplePatterns = [
        'what is', 'who is', 'when', 'where', 'definition', 'meaning',
        'hello', 'hi', 'hey', 'thanks', 'yes', 'no', 'help', 'info',
        'quick', 'simple', 'brief', 'short'
    ];

    // Check patterns
    for (const pattern of codingPatterns) {
        if (lower.includes(pattern)) return 'coding';
    }

    for (const pattern of visionPatterns) {
        if (lower.includes(pattern)) return 'vision';
    }

    for (const pattern of reasoningPatterns) {
        if (lower.includes(pattern)) return 'reasoning';
    }

    for (const pattern of simplePatterns) {
        if (lower.includes(pattern)) return 'simple';
    }

    return 'general';
}

module.exports = { detectTaskType };