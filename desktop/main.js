// Janela do jogo (Electron): tela cheia sem barra de menu; F11 alterna tela cheia, ESC continua indo para o jogo.
const {app,BrowserWindow,Menu,globalShortcut}=require('electron');
const path=require('path');
Menu.setApplicationMenu(null);
function create(){
  const w=new BrowserWindow({width:1672,height:941,minWidth:960,minHeight:540,backgroundColor:'#050506',title:'SCP Remake',
    icon:path.join(__dirname,'icon.png'),autoHideMenuBar:true,fullscreen:true,
    webPreferences:{contextIsolation:true,nodeIntegration:false,devTools:false,backgroundThrottling:false}});
  w.loadFile(path.join(__dirname,'game','index.html'));
  w.webContents.on('before-input-event',(e,i)=>{
    if(i.type!=='keyDown')return;
    if(i.key==='F11'){w.setFullScreen(!w.isFullScreen());e.preventDefault()}
    if((i.control||i.meta)&&['r','R','w','W'].includes(i.key))e.preventDefault(); // sem recarregar/fechar por acidente
  });
  w.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  w.webContents.on('will-navigate',e=>e.preventDefault());
  // "SAIR" do menu do jogo tenta window.close(): fecha o programa
  w.webContents.on('did-finish-load',()=>w.webContents.executeJavaScript("window.close=()=>{document.title='__quit__'}"));
  w.on('page-title-updated',(e,t)=>{if(t==='__quit__')app.quit()});
}
app.whenReady().then(create);
app.on('window-all-closed',()=>app.quit());
