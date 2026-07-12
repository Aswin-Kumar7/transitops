const fs = require('fs');
const path = require('path');

const filesToClean = [
  'Drivers.tsx', 'Fleet.tsx', 'Fuel.tsx', 'Maintenance.tsx', 'Settings.tsx', 'Trips.tsx'
];

for (const file of filesToClean) {
  const fp = path.join('src', 'pages', file);
  if (fs.existsSync(fp)) {
    let content = fs.readFileSync(fp, 'utf8');
    content = content.replace(/^const selectStyles = '.*';\n/m, '');
    fs.writeFileSync(fp, content);
  }
}

// Fix Dashboard.tsx
const dashboardPath = path.join('src', 'pages', 'Dashboard.tsx');
if (fs.existsSync(dashboardPath)) {
  let content = fs.readFileSync(dashboardPath, 'utf8');
  content = content.replace(/DashboardCircleIcon, ArrowUpRight01Icon, ArrowDown01Icon/g, 'DashboardCircleIcon, ArrowUpRight01Icon');
  content = content.replace(/DashboardCircleIcon, ArrowUpRight01Icon\n} from 'hugeicons-react';/g, "DashboardCircleIcon, ArrowUpRight01Icon\n} from 'hugeicons-react';");
  fs.writeFileSync(dashboardPath, content);
}

// Fix Analytics.tsx
const analyticsPath = path.join('src', 'pages', 'Analytics.tsx');
if (fs.existsSync(analyticsPath)) {
  let content = fs.readFileSync(analyticsPath, 'utf8');
  content = content.replace(/, Cell /g, ' ');
  content = content.replace(/const BAR_COLORS = \['#1B5E47', '#E5F5EF', '#10B981', '#34D399', '#A7F3D0'\];\n/g, '');
  content = content.replace(/radius=\{\[10, 10, 10, 10\]\}/g, 'radius={10}');
  fs.writeFileSync(analyticsPath, content);
}

console.log('Fixed TS issues');
