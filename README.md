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