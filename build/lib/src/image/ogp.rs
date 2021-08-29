use cairo::{ ImageSurface, Context };
use std::{fs::File, io, ops::Range, str};

pub use cairo::{ FontSlant as FontStyle, FontWeight };

struct LineBreaker<'a> {
    title: &'a str,
    lines: Vec<Range<usize>>,
}

impl<'a> LineBreaker<'a> {
    fn new(title: &'a str) -> Self {
        LineBreaker {
            title,
            lines: vec![],
        }
    }

    fn break_text(&mut self, context: &Context, width: f64, ) {
        let chars = self.title.char_indices();

        let mut line = 0..0;
        let mut line_width = 0.;
        for (i, ch) in chars.into_iter() {
            let extents = context.text_extents(&ch.to_string()).unwrap();

            let ch = extents.x_advance;

            if width <= line_width + ch {
                let start = line.end;
                self.lines.push(line);
                line = start..start;
                line_width = 0.;
            }

            line.end = i;
            line_width += ch;
        }

        self.lines.push(line);
    }
}

pub struct Style<'a> {
    pub padding_inline: f64,
    pub line_height: f64,
    pub font_size: f64,
    pub font_family: &'a str,
    pub font_style: FontStyle,
    pub font_weight: FontWeight,
}

pub struct Ogp<'a> {
    title: &'a str,
    style: Style<'a>,
}

impl<'a> Ogp<'a> {
    pub fn new(title: &'a str, style: Style<'a>) -> Self {
        Ogp {
            title,
            style,
        }
    }

    pub fn generate(&mut self, src: &str, dest: &str) -> io::Result<()> {
        let surface = {
            let mut file = File::open(src)?;
            ImageSurface::create_from_png(&mut file).expect("Could not create data from specified png file")
        };

        let window_height = surface.height() as f64;
        let window_width = surface.width() as f64;

        let text_area_width = window_width - self.style.padding_inline * 2.;

        let context = Context::new(&surface).expect("Could not initialize Context");

        // Initialize font metrics for line breaking.
        set_font(&context, self.style.font_family, self.style.font_style, self.style.font_weight, self.style.font_size);

        let mut line_breaker = LineBreaker::new(self.title);
        line_breaker.break_text(&context, text_area_width);

        let mut total_height = 0.;
        for line in &line_breaker.lines {
            let extents = context.text_extents(&self.title[line.clone()]).unwrap();
            total_height += extents.height;
        }

        let mut prev_extents_height = 0.;
        let lines_len = line_breaker.lines.len();
        for (i, line) in line_breaker.lines.into_iter().enumerate() {
            let is_first_line = i == 0;

            set_font(&context, self.style.font_family, self.style.font_style, self.style.font_weight, self.style.font_size);
            context.select_font_face("YuGothic", FontStyle::Normal, FontWeight::Bold);
            context.set_font_size(self.style.font_size);
            context.set_source_rgb(1., 1., 1.);

            let text = &self.title[line.clone()];

            let extents = context.text_extents(text).unwrap();
            let text_height = extents.height;

            let line_height = text_height * self.style.line_height / 2.;

            let pos_y = ((window_height - total_height) / 2.) - text_height / 2. + prev_extents_height;
            let pos_y = if !is_first_line {
                pos_y + line_height
            } else {
                pos_y
            };

            prev_extents_height += if !is_first_line  {
                text_height + line_height
            } else {
                text_height
            };

            if lines_len == 1 {
                context.move_to(window_width / 2. - extents.width / 2., window_height / 2. - text_height / 2.);
                context.show_text(text).unwrap();
                break;
            }

            context.move_to(self.style.padding_inline, pos_y);
            context.show_text(text).unwrap();
        }
    
    
        let mut file = File::create(dest)
            .expect("Couldn’t create file");
        surface.write_to_png(&mut file)
            .expect("Couldn’t write to png");
    
        Ok(())
    }
}
fn set_font(context: &Context, family: &str, style: FontStyle, weight: FontWeight, size: f64) {
    context.select_font_face(family, style, weight);
    context.set_font_size(size);
    context.set_source_rgb(1., 1., 1.);
}
