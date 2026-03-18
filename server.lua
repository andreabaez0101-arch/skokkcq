local DEFAULT_PROFILE = {
    showBadge = false,
    badgeIcon = 'crown',
    accent = '#FFD166',
    roleLabel = '',
    callsign = ''
}

local VALID_BADGE_ICONS = {
    crown = true,
    star = true,
    shield = true,
    bolt = true,
    diamond = true,
    flame = true
}

local VALID_ACCENTS = {
    ['#FFD166'] = true,
    ['#F97316'] = true,
    ['#22C55E'] = true,
    ['#38BDF8'] = true,
    ['#E879F9'] = true,
    ['#FB7185'] = true,
    ['#A3E635'] = true,
    ['#F8FAFC'] = true
}

local radioProfiles = {}

local function sanitizeShortText(value, maxLength)
    if value == nil then
        return ''
    end

    local text = tostring(value)
    text = text:gsub('^%s+', ''):gsub('%s+$', '')

    if #text > maxLength then
        text = text:sub(1, maxLength)
    end

    return text
end

local function sanitizeProfile(profile)
    profile = type(profile) == 'table' and profile or {}

    local badgeIcon = VALID_BADGE_ICONS[profile.badgeIcon] and profile.badgeIcon or DEFAULT_PROFILE.badgeIcon
    local accent = VALID_ACCENTS[profile.accent] and profile.accent or DEFAULT_PROFILE.accent

    return {
        showBadge = profile.showBadge == true,
        badgeIcon = badgeIcon,
        accent = accent,
        roleLabel = sanitizeShortText(profile.roleLabel, 14),
        callsign = sanitizeShortText(profile.callsign, 18)
    }
end

local function getPlayerProfile(src)
    if not radioProfiles[src] then
        radioProfiles[src] = sanitizeProfile(DEFAULT_PROFILE)
    end

    return radioProfiles[src]
end

local function getPlayerRadioChannel(src)
    local player = Player(src)
    if not player then
        return 0
    end

    return tonumber(player.state.radioChannel) or 0
end

local function getCharacterName(src)
    local player = exports.qbx_core:GetPlayer(src)
    if not player then
        return GetPlayerName(src)
    end

    local charinfo = player.PlayerData.charinfo or {}
    local firstname = charinfo.firstname or ''
    local lastname = charinfo.lastname or ''
    local fullname = ('%s %s'):format(firstname, lastname):gsub('^%s+', ''):gsub('%s+$', '')

    if fullname == '' then
        return GetPlayerName(src)
    end

    return fullname
end

local function getChannelMembers(channel)
    if GetResourceState('pma-voice') ~= 'started' then
        return {}
    end

    local members = {}
    local players = exports['pma-voice']:getPlayersInRadioChannel(channel)

    for playerId, isTalking in pairs(players) do
        local src = tonumber(playerId) or playerId
        local profile = getPlayerProfile(src)

        members[#members + 1] = {
            id = src,
            name = getCharacterName(src),
            talking = isTalking == true,
            showBadge = profile.showBadge,
            badgeIcon = profile.badgeIcon,
            accent = profile.accent,
            roleLabel = profile.roleLabel,
            callsign = profile.callsign
        }
    end

    table.sort(members, function(a, b)
        return (a.name or '') < (b.name or '')
    end)

    return members
end

local function broadcastMembers(channel)
    if channel < 1 or GetResourceState('pma-voice') ~= 'started' then
        return
    end

    local members = getChannelMembers(channel)
    local players = exports['pma-voice']:getPlayersInRadioChannel(channel)

    for playerId in pairs(players) do
        TriggerClientEvent('dopa_radio_script:client:updateMembers', tonumber(playerId) or playerId, channel, members)
    end
end

RegisterNetEvent('dopa_radio_script:server:requestMembers', function(channel)
    channel = math.floor(tonumber(channel) or 0)
    if channel < 1 then return end

    local playerChannel = getPlayerRadioChannel(source)
    if playerChannel ~= channel then
        return
    end

    TriggerClientEvent('dopa_radio_script:client:updateMembers', source, channel, getChannelMembers(channel))
end)

RegisterNetEvent('dopa_radio_script:server:updateProfile', function(profile)
    radioProfiles[source] = sanitizeProfile(profile)

    local channel = getPlayerRadioChannel(source)
    if channel > 0 then
        broadcastMembers(channel)
    end
end)

AddEventHandler('playerDropped', function()
    radioProfiles[source] = nil
end)
