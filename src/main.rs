use warp::Filter;
use warp::ws::Message;
use futures::{TryStreamExt, TryFutureExt};
use futures::prelude::*;
use tokio::net::UdpSocket;
use tokio::sync::{broadcast, mpsc};

#[derive(Debug)]
enum Error {
    RecvError(broadcast::RecvError),
    SendError,
}


#[tokio::main]
async fn main() {
    pretty_env_logger::init();
    let (sender, _) = broadcast::channel::<Vec<u8>>(60);
    let udp_sender = sender.clone();

    tokio::spawn(async move {
        let mut socket = UdpSocket::bind("0.0.0.0:12345").await.unwrap();
        loop {
            let mut buffer = vec![0u8; 2048];
            let (size, _addr) = socket.recv_from(&mut buffer).await.unwrap();
            buffer.truncate(size);
            let s = match String::from_utf8(buffer) {
                Ok(s) => s,
                _ => continue,
            };
            let s: Vec<&str> = s.splitn(2, ":").collect();
            if s.len() != 2 {
                continue
            }
            let s = s[1].replace(" ", "").replace("\t", "").replace("\n", "");
            let data = match hex::decode(s) {
                Ok(d) => d,
                _ => continue,
            };
            let _ = udp_sender.send(data);
        }
    });

    let route = (warp::path("udp")
        .and(warp::ws())
        .and(warp::any().map(move || sender.clone()))
        .map(|ws: warp::ws::Ws, sender: broadcast::Sender<Vec<u8>>| {
            ws.on_upgrade(move |websocket| {
                let (ws_tx, ws_rx) = mpsc::channel(1);
                tokio::spawn(
                    ws_rx.forward(websocket),
                );
                let rx = sender.subscribe();
                rx.map_ok(Message::binary)
                    .map_err(Error::RecvError)
                    .try_for_each(move |result| {
                        let mut ws_tx = ws_tx.clone();
                        async move {
                            ws_tx.send(Ok(result)).map_err(|_| Error::SendError).await
                        }
                    })
                    .map(|result| {
                        if let Err(e) = result {
                            eprintln!("websocket error: {:?}", e);
                        }
                    })
            })
        }))
        .or(warp::get()
            .and(warp::fs::dir("./frontend/dist/"))
        )
        .or(warp::fs::file("./frontend/dist/index.html"));

    warp::serve(route)
        .run(([127, 0, 0, 1], 13030))
        .await;
}
