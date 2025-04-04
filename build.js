const electronInstaller = require('electron-winstaller');

async function build() {
  try {
    await electronInstaller.createWindowsInstaller({
      appDirectory: './out/garrylord-editor-win32-x64',
      outputDirectory: './out/installer',
      authors: '晦涩弗里曼',
      exe: 'garrylord-editor.exe',
      noMsi: true,
      setupIcon: 'favicon.ico',
      skipUpdateIcon: true,
      setupExe: 'GarryLordEditorSetup.exe',
    });
    console.log('Installer created successfully!');
  } catch (e) {
    console.error(`Error creating installer: ${e.message}`);
  }
}

build();