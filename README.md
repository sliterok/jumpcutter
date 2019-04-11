# Telegram voice jumpcutter
Automatically cuts silent parts of voice message in telegram

demo: [@jumpcutterbot](https://t.me/jumpcutterbot)

# Set up
To set this up you would need to install python modules using pip and node modules with npm. Then you could create token.txt with your bot's token.

## Building with nix
`nix-build` to get a script with all the libraries and ffmpeg, `nix-build -A bundle` to get a single binary.
