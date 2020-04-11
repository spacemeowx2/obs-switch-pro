function get_ws(on_message) {
    let ws = new WebSocket(`ws://${location.host}/udp`)
    const bindEvents = (ws) => {
        ws.onmessage = (e) => {
            on_message(e.data)
        }
        ws.onclose = () => {
            get_ws(on_message)
        }
    }
    bindEvents(ws)
}
