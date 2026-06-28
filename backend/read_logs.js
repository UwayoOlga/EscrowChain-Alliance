import fs from 'fs';
import path from 'path';

const files = [
    'build.log',
    'build_error.txt',
    'build_log.txt',
    'build_out.log',
    'build_stderr.txt',
    'build_stdout.txt',
    'check.log',
    'check_result.log',
    'err.log',
    'fresh_build.log',
    'verbose.log'
];

async function main() {
    for (const file of files) {
        const filePath = path.join('./contracts', file);
        if (!fs.existsSync(filePath)) continue;

        try {
            const buf = fs.readFileSync(filePath);
            
            // Try to decode as UTF-16LE, if it contains UTF-16 specific bytes
            let content = '';
            if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
                // BOM present for UTF-16LE
                content = buf.toString('utf16le');
            } else {
                // Try UTF-16LE, if fail fallback to utf8
                content = buf.toString('utf16le');
                if (content.includes('\u0000')) {
                    content = buf.toString('utf8');
                }
            }

            console.log(`\n========================================`);
            console.log(`FILE: ${file}`);
            console.log(`========================================`);
            console.log(content.trim().substring(0, 1000));
        } catch (err) {
            console.error(`Error reading ${file}:`, err.message);
        }
    }
}

main();
