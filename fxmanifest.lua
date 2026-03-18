fx_version 'cerulean'
game 'gta5'

lua54 'yes'

author 'Dopa / Codex'
description 'Custom radio UI connected to ox_inventory and pma-voice'

ui_page 'index.html'

shared_script '@ox_lib/init.lua'

client_script {
    '@qbx_core/modules/playerdata.lua',
    'client.lua'
}

server_script 'server.lua'

files {
    'index.html',
    'script.js',
    'styles.css',
    'dopa_assets/radio_shell.png'
}

dependencies {
    'ox_lib'
}
