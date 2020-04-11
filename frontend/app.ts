function get_ws(on_message: (msg: ArrayBuffer) => void) {
    let ws = new WebSocket(`ws://${location.host}/udp`)
    ws.binaryType = 'arraybuffer'
    const bindEvents = (ws: WebSocket) => {
        ws.onmessage = (e) => {
            on_message(e.data)
        }
        ws.onclose = () => {
            get_ws(on_message)
        }
    }
    bindEvents(ws)
}
function from_msg(msg: ArrayBuffer) {
    let view = new DataView(msg)
    if (view.getUint8(0) != 0x30) {
        return
    }
    return {
        
    }
}
get_ws((msg) => {
    const state = from_msg(msg)
    console.log(state)
})