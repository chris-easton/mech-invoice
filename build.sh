#!/usr/bin/env bash

set -e  # Exit on any error

mkdir -p dist

raw_file_types=(svg txt js html css)

# Load entire index.html into a variable
html="$(< html/index.html)"


Embed() {

    file=$1
    filename="$(basename "$file")"         # e.g. "logo.svg"
    baseNoExt="${filename%.*}"             # e.g. "logo"
    token="$(echo "$baseNoExt" | tr '[:lower:]' '[:upper:]')"  # e.g. "LOGO"
    ext="${filename##*.}"                  # e.g. "svg"

    if [[ " ${raw_file_types[@]} " =~ " $ext " ]]; then
        # Inline raw file
        content="$(< "$file")"
    else
        # Base64-encode (for .ttf, .png, etc.)
        # 'base64 -w 0' avoids line wrapping
        content=$(base64 -w 0 "$file")
    fi

    # Perform the substitution: replace @TOKEN@ with content
    html="${html//@$token@/$content}"
}

Embed "js/main.js"

# Loop over js folder
for file in js/*.{txt,js}; do
    # Skip if glob didn't match any file
    [ -f "$file" ] || continue
    if [[ "$file" == "js/main.js" ]]; then
        continue
    fi
    Embed "$file"
done

# Loop over html folder
for file in html/*.{txt,html}; do
    # Skip if glob didn't match any file
    [ -f "$file" ] || continue
    Embed "$file"
done

# Loop over resources folder
for file in resources/*.{ttf,png,svg,txt,js}; do
    # Skip if glob didn't match any file
    [ -f "$file" ] || continue
    Embed "$file"
done

# Loop over 3rd party resources folder
for file in 3rd_party/*.{ttf,png,svg,txt,js}; do
    # Skip if glob didn't match any file
    [ -f "$file" ] || continue
    Embed "$file"
done

# Loop over css folder
for file in css/*.{txt,css}; do
    # Skip if glob didn't match any file
    [ -f "$file" ] || continue
    Embed "$file"
done

# Write the final HTML to build/index.html
echo "$html" > dist/index.html

cp resources/manifest.json dist/
cp resources/favicon-48x48.png dist/
cp resources/favicon-192x192.png dist/
cp resources/favicon-512x512.png dist/

echo "Created dist/index.html with embedded resources."

