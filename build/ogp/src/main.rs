use lib::image::ogp::{self, Ogp};
use std::io;

fn main() -> io::Result<()> {
    let text = "これはOGPのタイトルです。ブログのタイトルが入る予定です。Rust言語でブラウザ作ってみた。";
    let mut ogp = Ogp::new(text, ogp::Style {
        padding_inline: 20.,
        line_height: 1.8,
        font_family: "YuGothic",
        font_size: 50.,
        font_style: ogp::FontStyle::Normal,
        font_weight: ogp::FontWeight::Bold,
    });
    ogp.generate("./assets/ogp_template.png", "./output.png")?;
    Ok(())
}
