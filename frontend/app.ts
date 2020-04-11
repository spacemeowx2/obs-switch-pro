const enum ButtonBitMap {
    Y = 0,
    X = 1,
    B = 2,
    A = 3,
    _RightSR = 4,
    _RightSL = 5,
    R = 6,
    ZR = 7,

    Minus = 8,
    Plus = 9,
    RStick = 10,
    LStick = 11,
    Home = 12,
    Capture = 13,
    _reversed1 = 14,
    _reversed2 = 15,

    Down = 16,
    Up = 17,
    Right = 18,
    Left = 19,
    _LeftSR = 20,
    _LeftSL = 21,
    L = 22,
    ZL = 23,
}

function get_ws(on_message: (msg: ArrayBuffer) => void) {
    let ws = new WebSocket(`ws://${location.host}/udp`)
    ws.binaryType = 'arraybuffer'
    const bindEvents = (ws: WebSocket) => {
        ws.onmessage = (e) => {
            on_message(e.data)
        }
        ws.onclose = () => {
            setTimeout(() => get_ws(on_message), 1000)
        }
    }
    bindEvents(ws)
}
function get_btn(btns: Uint8Array, key: ButtonBitMap) {
    const idx = Math.floor(key / 8)
    const bit = key % 8
    return (btns[idx] & (1 << bit)) !== 0
}
function get_stick(data: Uint8Array) {
    const stick_horizontal = data[0] | ((data[1] & 0xF) << 8)
    const stick_vertical = (data[1] >> 4) | (data[2] << 4)
    return {
        x: stick_horizontal / 4095 * 2 - 1,
        y: stick_vertical / 4095 * 2 - 1,
    }
}
function from_msg(msg: ArrayBuffer) {
    let u8 = new Uint8Array(msg)
    let view = new DataView(msg)

    if (view.getUint8(0) != 0x30) {
        return
    }
    const btns = u8.slice(3, 3 + 3)
    const left_stick = get_stick(u8.slice(6, 6 + 3))
    const right_stick = get_stick(u8.slice(9, 9 + 3))

    return {
        A: get_btn(btns, ButtonBitMap.A),
        B: get_btn(btns, ButtonBitMap.B),
        X: get_btn(btns, ButtonBitMap.X),
        Y: get_btn(btns, ButtonBitMap.Y),
        
        L: get_btn(btns, ButtonBitMap.L),
        R: get_btn(btns, ButtonBitMap.R),
        ZL: get_btn(btns, ButtonBitMap.ZL),
        ZR: get_btn(btns, ButtonBitMap.ZR),

        Up: get_btn(btns, ButtonBitMap.Up),
        Down: get_btn(btns, ButtonBitMap.Down),
        Left: get_btn(btns, ButtonBitMap.Left),
        Right: get_btn(btns, ButtonBitMap.Right),

        Plus: get_btn(btns, ButtonBitMap.Plus),
        Minus: get_btn(btns, ButtonBitMap.Minus),
        Capture: get_btn(btns, ButtonBitMap.Capture),
        Home: get_btn(btns, ButtonBitMap.Home),

        LeftStick: left_stick,
        RightStick: right_stick,
    }
}
const ActiveColor = '#f00'
function set_btn_state(id: string, val: boolean) {
    const e = document.getElementById(id)
    if (val) {
        e?.setAttribute('fill', ActiveColor)
    } else {
        e?.removeAttribute('fill')
    }
}
function set_stick_state(id: string, {x, y}: {x: number, y: number}) {
    const e = document.getElementById(id)
    e?.setAttribute('transform', `translate(${(x * 4).toFixed(2)},${(-y * 4).toFixed(2)})`)
}
get_ws((msg) => {
    const state = from_msg(msg)
    if (!state) {
        return
    }

    set_btn_state('ba', state.A)
    set_btn_state('bb', state.B)
    set_btn_state('bx', state.X)
    set_btn_state('by', state.Y)
    set_btn_state('plus', state.Plus)
    set_btn_state('minus', state.Minus)
    set_btn_state('home', state.Home)
    set_btn_state('capture', state.Capture)

    set_btn_state('up', state.Up)
    set_btn_state('down', state.Down)
    set_btn_state('left', state.Left)
    set_btn_state('right', state.Right)

    set_btn_state('l', state.L)
    set_btn_state('zl', state.ZL)
    set_btn_state('r', state.R)
    set_btn_state('zr', state.ZR)

    set_stick_state('left_stick', state.LeftStick)
    set_stick_state('right_stick', state.RightStick)
})
