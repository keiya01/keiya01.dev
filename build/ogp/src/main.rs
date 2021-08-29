use lib::image::Ogp;
use std::io;

fn main() -> io::Result<()> {
    let text = "これはOGPのタイトルです。ブログのタイトルが入る予定です。Rust言語でブラウザ作ってみた。";
    let mut ogp = Ogp::new(text, 984., 20., 1.8);
    ogp.generate("./assets/ogp_template.png", "./output.png")?;
    Ok(())
}
