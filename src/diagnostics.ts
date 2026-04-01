function extractRelevantLatexLines(text: string): string[] {
    return text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => {
            const lower = line.toLowerCase();
            return (
                line.startsWith('!') ||
                /:\d+:/.test(line) ||
                lower.includes('error:') ||
                lower.includes('warning:') ||
                lower.includes('undefined control sequence') ||
                lower.includes('emergency stop') ||
                lower.includes('fatal error') ||
                lower.includes('runaway argument') ||
                lower.includes('misplaced')
            );
        });
}

export function printLeanCommandDiagnostics(commandName: string, stdout?: string, stderr?: string) {
    const combined = [stderr ?? '', stdout ?? ''].join('\n');
    const relevantLines = extractRelevantLatexLines(combined);

    if (relevantLines.length > 0) {
        const MAX_LINES = 12;
        const linesToPrint = relevantLines.slice(0, MAX_LINES);
        console.error(`${commandName} diagnostics:`);
        for (const line of linesToPrint) {
            console.error(line);
        }

        if (relevantLines.length > MAX_LINES) {
            console.error(`... (${relevantLines.length - MAX_LINES} more relevant lines)`);
        }
        return;
    }

    if ((stderr ?? '').trim()) {
        const tail = (stderr ?? '').trim().split(/\r?\n/).slice(-8).join('\n');
        console.error(`${commandName} stderr (tail):\n${tail}`);
        return;
    }

    if ((stdout ?? '').trim()) {
        const tail = (stdout ?? '').trim().split(/\r?\n/).slice(-8).join('\n');
        console.error(`${commandName} stdout (tail):\n${tail}`);
    }
}
