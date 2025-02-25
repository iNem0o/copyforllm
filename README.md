# Copy as Prompt for LLM

[![CI](https://github.com/iNem0o/copyforllm/actions/workflows/ci.yml/badge.svg)](https://github.com/iNem0o/copyforllm/actions/workflows/ci.yml)
[![Tests](https://github.com/iNem0o/copyforllm/actions/workflows/tests.yml/badge.svg)](https://github.com/iNem0o/copyforllm/actions/workflows/tests.yml)
[![VS Code Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/iNem0o.copyforllm)](https://marketplace.visualstudio.com/items?itemName=iNem0o.copyforllm)
[![VS Code Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/iNem0o.copyforllm)](https://marketplace.visualstudio.com/items?itemName=iNem0o.copyforllm)
[![VS Code Marketplace Rating](https://img.shields.io/visual-studio-marketplace/r/iNem0o.copyforllm)](https://marketplace.visualstudio.com/items?itemName=iNem0o.copyforllm&ssr=false#review-details)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This VS Code extension allows you to quickly copy one or multiple files as Markdown-formatted text, ready to be pasted into a Large Language Model (LLM) like ChatGPT, Claude, or others.

<p align="center">
  <img src="images/demo.gif" alt="Copy as Prompt Demo" width="800">
</p>

## Features

- Right-click on a file or folder in the Explorer and select "Copy as Prompt" to copy its content in Markdown format
- Select multiple files to copy all of them at once
- Recursive directory support: when selecting a folder, all files inside it (including in subdirectories) will be copied
- Automatic language detection for syntax highlighting based on file extension
- Formats the output with the filename in bold and the content in a code block
- Smart file handling: skips binary files and limits file sizes to prevent clipboard issues
- Copy only selected text with "Copy Selection as Prompt"
- Full file paths in headers for better context
- Automatic filtering of sensitive files (like .env)
- Masking of sensitive content (API keys, passwords, etc.)
- Customizable separators between files

Example output when copying a JavaScript file:

```
**script.js**

```javascript
// Your JavaScript code here
console.log("Hello, world!");
```

## Usage

1. Select one or more files or folders in the VS Code Explorer
2. Right-click and choose "Copy as Prompt" from the context menu
3. Paste the formatted content into your favorite LLM

When copying a folder, all text files within that folder (including in subdirectories) will be included with their relative paths.

### Copying Selected Text

1. Select specific lines of code in your editor
2. Right-click and choose "Copy Selection as Prompt" from the context menu
3. Only the selected text will be copied, with the file path included

### Advanced Features

#### Full File Paths

By default, the extension includes the full file path in the header of each file, making it easier for LLMs to understand the context and structure of your codebase.

Example:
```
**/path/to/your/script.js**

```javascript
// Your JavaScript code here
console.log("Hello, world!");
```

#### Sensitive Content Protection

The extension automatically:
- Skips sensitive files like `.env`, `.git`, and `node_modules`
- Masks sensitive content such as API keys, passwords, and secrets

For example, if your code contains:
```javascript
const API_KEY = "sk_1234567890abcdef";
```

It will be copied as:
```javascript
const API_KEY = "****";
```

This helps prevent accidentally sharing sensitive information with LLMs.

#### Customizable Separators

You can customize how files are separated in the copied output. By default, files are separated by a blank line, but you can change this in your VS Code settings:

1. Open VS Code Settings (File > Preferences > Settings or Ctrl+,)
2. Search for "copyforllm"
3. Find the "Separator" setting and change it to your preferred separator (e.g., "---" for a horizontal rule)

This allows you to format the output in a way that works best with your preferred LLM.

## Development

This extension was developed using AI-Driven Development (ADD) approach:
1. OpenAI o1 was used to generate the roadmap and devbook
2. Claude 3.7 was used to generate the code
3. The code was written in a TDD manner, with tests being written first to define the expected behavior



## Known Limitations

- Files larger than 5MB are skipped to prevent performance issues
- Total clipboard content is limited to 50MB
- Binary files (images, executables, etc.) are automatically skipped

## Installation

### VS Code Marketplace


### GitHub Releases

If the extension is not yet available on the VS Code Marketplace, you can install it from GitHub Releases:

1. Go to the [Releases page](https://github.com/iNem0o/copyforllm/releases) of this repository
2. Download the latest `.vsix` file
3. In VS Code, go to Extensions (Ctrl+Shift+X)
4. Click on the "..." menu at the top of the Extensions panel
5. Select "Install from VSIX..."
6. Choose the downloaded file

### Manual Installation

You can also build and install the extension manually:

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to compile the TypeScript code
4. Run `npx @vscode/vsce package` to create a VSIX file
5. In VS Code, go to Extensions (Ctrl+Shift+X)
6. Click on the "..." menu at the top of the Extensions panel
7. Select "Install from VSIX..."
8. Choose the generated VSIX file

## Release Notes

### 1.0.1

Major update with new features:
- Added "Copy Selection as Prompt" to copy only selected text
- Added full file paths in headers for better context
- Added automatic filtering of sensitive files (like .env)
- Added masking of sensitive content (API keys, passwords, etc.)
- Added customizable separators between files

### 1.0.0

Initial release of Copy as Prompt for LLM:
- Copy single files as Markdown
- Copy multiple files as Markdown
- Recursive directory support
- Automatic language detection for syntax highlighting
- Smart file handling to prevent clipboard issues

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please make sure your code passes all tests and linting rules.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.