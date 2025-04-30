import os
import re
import base64
import shutil

# Define the directories where the files are located
DIRECTORIES = [
    'js',
    'html',
    'resources',
    '3rd_party',
    'css'
]

# Allowed extensions for direct embedding
DIRECT_EMBED_EXTENSIONS = ['svg', 'txt', 'js', 'html', 'css']

# Mapping of file extensions for relevant types
EXTENSIONS = [
    'js',
    'html',
    'css',
    'svg',
    'txt',
    'ttf',
    'png',
    # Add other extensions as needed
]

def find_file(token):
    # Search for the file in specified directories by token (base filename)
    for dir_name in DIRECTORIES:
        for ext in EXTENSIONS:
            possible_file = os.path.join(dir_name, f"{token.lower()}.{ext}")
            if os.path.exists(possible_file):
                return possible_file
    return None

def replace_tokens(content, processed_files):
    # Regular expression to find tokens such as @file1@
    pattern = r'@(\w+)@'

    def replace_match(match):
        token = match.group(1)  # Extract the token (base filename without extension)

        if token in processed_files:
            return processed_files[token]  # Return the already processed content

        # Find the actual file path using the token
        filename = find_file(token)
        if not filename:
            print(f"Warning: File for token @{token}@ not found.")
            return ''  # Returning empty if no file is found

        try:
            with open(filename, 'rb') as f:  # Read as binary to handle different file types
                file_content = f.read()
                _, ext = os.path.splitext(filename)
                ext = ext[1:]  # Remove leading dot

                if ext in DIRECT_EMBED_EXTENSIONS:
                    processed_files[token] = file_content.decode('utf-8')  # Decode bytes to string for direct embed
                else:
                    # Encode in base64
                    processed_files[token] = base64.b64encode(file_content).decode('utf-8')

                # Recursively replace tokens
                processed_files[token] = replace_tokens(processed_files[token], processed_files)
                return processed_files[token]
        except Exception as e:
            print(f"Error processing file for token @{token}@: {e}")
            return ''

    return re.sub(pattern, replace_match, content)

def copy_files():
   shutil.copy('resources/manifest.json', 'dist/manifest.json')
   shutil.copy('resources/favicon-48x48.png', 'dist/favicon-48x48.png')
   shutil.copy('resources/favicon-192x192.png', 'dist/favicon-192x192.png')
   shutil.copy('resources/favicon-512x512.png', 'dist/favicon-512x512.png')

def main():
    root_file = 'html/index.html'
    output_file = 'dist/index.html'

    # Ensure the output directory exists
    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    try:
        with open(root_file, 'r') as f:
            root_content = f.read()

        processed_files = {}
        final_content = replace_tokens(root_content, processed_files)

        # Write the final content to the output file
        with open(output_file, 'w') as f:
            f.write(final_content)

        print(f"Successfully created {output_file}")

    except FileNotFoundError:
        print(f"Error: The root file '{root_file}' was not found.")

    copy_files()

if __name__ == "__main__":
    main()
