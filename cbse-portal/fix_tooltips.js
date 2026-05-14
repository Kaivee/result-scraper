const fs = require('fs');
let c = fs.readFileSync('src/components/Graphs.tsx', 'utf8');

c = c.replace(/<Tooltip contentStyle=\{tooltipStyle\} cursor=\{\{ fill: isDark \? '#1e293b' : '#f1f5f9' \}\} \/>/g, "<Tooltip contentStyle={tooltipStyle} itemStyle={{ color: isDark ? '#e2e8f0' : '#334155' }} labelStyle={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 'bold', marginBottom: '4px' }} cursor={{ fill: isDark ? '#1e293b' : '#f1f5f9' }} />");

c = c.replace(/<Tooltip contentStyle=\{tooltipStyle\} \/>/g, "<Tooltip contentStyle={tooltipStyle} itemStyle={{ color: isDark ? '#e2e8f0' : '#334155' }} labelStyle={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 'bold', marginBottom: '4px' }} />");

fs.writeFileSync('src/components/Graphs.tsx', c);
console.log('Fixed tooltips in Graphs.tsx');
