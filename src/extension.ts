// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// Maximum size for a file to be processed (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
// Maximum total content size for clipboard (50MB)
const MAX_CLIPBOARD_SIZE = 50 * 1024 * 1024;

// Configuration helper
class ConfigHelper {
	// Get configuration object
	private static getConfig() {
		return vscode.workspace.getConfiguration('copyforllm');
	}
	
	// Get custom separator
	static getSeparator(): string {
		const separator = this.getConfig().get<string>('separator', '');
		return separator ? separator + '\n' : '';
	}
	
	// Get header format
	static getHeaderFormat(filePath: string): string {
		const headerFormat = this.getConfig().get<string>('headerFormat', '**{filePath}**');
		return headerFormat.replace('{filePath}', filePath);
	}
	
	// Get ignored extensions
	static getIgnoredExtensions(): string[] {
		return this.getConfig().get<string[]>('ignoredExtensions', ['.env', '.git', '.gitignore']);
	}
	
	// Check if a file should be ignored based on its extension
	static shouldIgnoreFile(filePath: string): boolean {
		const extension = path.extname(filePath).toLowerCase();
		const ignoredExtensions = this.getIgnoredExtensions();
		return ignoredExtensions.includes(extension);
	}
	
	// Get sensitive patterns
	static getSensitivePatterns(): Array<{ pattern: string, replacement: string }> {
		return this.getConfig().get<Array<{ pattern: string, replacement: string }>>('sensitivePatterns', [
			{ pattern: 'API_KEY\\s*=\\s*["\']?[^"\'\\s]+["\']?', replacement: 'API_KEY=****' },
			{ pattern: 'PASSWORD\\s*=\\s*["\']?[^"\'\\s]+["\']?', replacement: 'PASSWORD=****' },
			{ pattern: 'SECRET\\s*=\\s*["\']?[^"\'\\s]+["\']?', replacement: 'SECRET=****' }
		]);
	}
	
	// Mask sensitive content in a string
	static maskSensitiveContent(content: string): string {
		const patterns = this.getSensitivePatterns();
		let maskedContent = content;
		
		for (const { pattern, replacement } of patterns) {
			try {
				const regex = new RegExp(pattern, 'g');
				maskedContent = maskedContent.replace(regex, replacement);
			} catch (error) {
				console.error(`Error applying sensitive pattern ${pattern}:`, error);
			}
		}
		
		return maskedContent;
	}
}

// Function to detect language from file extension
function detectLanguage(filePath: string): string {
	const extension = path.extname(filePath).toLowerCase();
	// Map of file extensions to markdown language identifiers
	const languageMap: { [key: string]: string } = {
		'.js': 'javascript',
		'.ts': 'typescript',
		'.html': 'html',
		'.css': 'css',
		'.json': 'json',
		'.md': 'markdown',
		'.py': 'python',
		'.java': 'java',
		'.c': 'c',
		'.cpp': 'cpp',
		'.cs': 'csharp',
		'.go': 'go',
		'.php': 'php',
		'.rb': 'ruby',
		'.rs': 'rust',
		'.sh': 'bash',
		'.swift': 'swift',
		'.xml': 'xml',
		'.yaml': 'yaml',
		'.yml': 'yaml',
		// Add more mappings as needed
	};

	return languageMap[extension] || '';
}

// Function to check if a file should be processed based on its extension
function shouldProcessFile(filePath: string): boolean {
	// Skip binary files and other non-text files
	const extension = path.extname(filePath).toLowerCase();
	const binaryExtensions = [
		'.exe', '.dll', '.so', '.dylib', '.bin', '.dat', '.db', '.sqlite', '.sqlite3',
		'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.webp', '.tiff',
		'.mp3', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.wav', '.ogg',
		'.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz',
		'.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'
	];
	
	// Check if the file should be ignored based on configuration
	if (ConfigHelper.shouldIgnoreFile(filePath)) {
		return false;
	}
	
	return !binaryExtensions.includes(extension);
}

// Function to recursively get all files in a directory
async function getAllFilesInDirectory(dirPath: string): Promise<string[]> {
	const files: string[] = [];
	
	// Read directory contents
	const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
	
	// Process each entry
	for (const entry of entries) {
		const fullPath = path.join(dirPath, entry.name);
		
		if (entry.isDirectory()) {
			// Recursively get files from subdirectory
			const subDirFiles = await getAllFilesInDirectory(fullPath);
			files.push(...subDirFiles);
		} else if (shouldProcessFile(fullPath)) {
			// Add file to the list if it's a text file
			files.push(fullPath);
		}
	}
	
	return files;
}

// Function to format file content as markdown with full path
function formatFileAsMarkdown(filePath: string, content: string): string {
	// Detect language for syntax highlighting
	const language = detectLanguage(filePath);
	
	// Mask sensitive content
	const maskedContent = ConfigHelper.maskSensitiveContent(content);
	
	// Get custom header format
	const headerFormat = ConfigHelper.getHeaderFormat(filePath);
	
	// Format as markdown with custom header
	return `${headerFormat}\n\n\`\`\`${language}\n${maskedContent}\n\`\`\`\n\n`;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "copyforllm" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const helloWorldDisposable = vscode.commands.registerCommand('copyforllm.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from CopyForLLM!');
	});

	// Register our copyAsPrompt command
	const copyFilesDisposable = vscode.commands.registerCommand('copyforllm.copyAsPrompt', async (uri: vscode.Uri, uris: vscode.Uri[]) => {
		try {
			// Handle multiple files selection
			const selectedItems = uris && uris.length > 0 ? uris : uri ? [uri] : [];
			
			if (selectedItems.length === 0) {
				vscode.window.showErrorMessage('No files or folders selected for copying.');
				return;
			}

			let markdownContent = '';
			let processedFiles = 0;
			let totalFiles = 0;
			let skippedFiles = 0;
			let totalContentSize = 0;
			
			// Get custom separator
			const separator = ConfigHelper.getSeparator();

			// Process each selected item (file or directory)
			for (const itemUri of selectedItems) {
				try {
					// Get file stats to check if it's a directory
					const stats = await fs.promises.stat(itemUri.fsPath);
					
					if (stats.isDirectory()) {
						// Get all files in the directory recursively
						const dirFiles = await getAllFilesInDirectory(itemUri.fsPath);
						totalFiles += dirFiles.length;
						
						// Process each file in the directory
						for (const filePath of dirFiles) {
							try {
								// Check file size before reading
								const fileStats = await fs.promises.stat(filePath);
								if (fileStats.size > MAX_FILE_SIZE) {
									console.log(`Skipping large file: ${filePath} (${fileStats.size} bytes)`);
									skippedFiles++;
									continue;
								}

								// Check if adding this file would exceed the clipboard size limit
								if (totalContentSize + fileStats.size > MAX_CLIPBOARD_SIZE) {
									console.log(`Clipboard size limit reached. Skipping remaining files.`);
									skippedFiles++;
									continue;
								}

								// Read file content
								const fileContent = await fs.promises.readFile(filePath, 'utf8');
								
								// Format as markdown with full path
								const fileMarkdown = formatFileAsMarkdown(filePath, fileContent);
								
								// Add separator if not the first file
								if (markdownContent && separator) {
									markdownContent += separator;
								}
								
								markdownContent += fileMarkdown;
								totalContentSize += fileMarkdown.length + separator.length;
								processedFiles++;
							} catch (fileError) {
								console.error(`Error processing file ${filePath}:`, fileError);
								skippedFiles++;
							}
						}
					} else {
						// It's a file, process it directly
						totalFiles++;
						
						// Skip ignored files based on extension
						if (ConfigHelper.shouldIgnoreFile(itemUri.fsPath)) {
							console.log(`Ignoring file with ignored extension: ${itemUri.fsPath}`);
							skippedFiles++;
							continue;
						}
						
						// Skip binary files
						if (!shouldProcessFile(itemUri.fsPath)) {
							console.log(`Skipping binary file: ${itemUri.fsPath}`);
							skippedFiles++;
							continue;
						}
						
						// Check file size before reading
						if (stats.size > MAX_FILE_SIZE) {
							console.log(`Skipping large file: ${itemUri.fsPath} (${stats.size} bytes)`);
							skippedFiles++;
							continue;
						}

						// Check if adding this file would exceed the clipboard size limit
						if (totalContentSize + stats.size > MAX_CLIPBOARD_SIZE) {
							console.log(`Clipboard size limit reached. Skipping remaining files.`);
							skippedFiles++;
							continue;
						}

						// Read file content
						const fileContent = await fs.promises.readFile(itemUri.fsPath, 'utf8');
						
						// Format as markdown with full path
						const fileMarkdown = formatFileAsMarkdown(itemUri.fsPath, fileContent);
						
						// Add separator if not the first file
						if (markdownContent && separator) {
							markdownContent += separator;
						}
						
						markdownContent += fileMarkdown;
						totalContentSize += fileMarkdown.length + separator.length;
						processedFiles++;
					}
				} catch (itemError) {
					console.error(`Error processing item ${itemUri.fsPath}:`, itemError);
					skippedFiles++;
				}
			}

			if (markdownContent) {
				// Copy to clipboard
				await vscode.env.clipboard.writeText(markdownContent);
				
				let message = `Copied ${processedFiles} of ${totalFiles} files to clipboard as Markdown!`;
				if (skippedFiles > 0) {
					message += ` (${skippedFiles} files skipped due to size or format)`;
				}
				
				vscode.window.showInformationMessage(message);
			} else {
				vscode.window.showWarningMessage('No valid file content to copy. Files may be too large or in binary format.');
			}
		} catch (error) {
			console.error('Error in copyAsPrompt command:', error);
			vscode.window.showErrorMessage('Failed to copy content: ' + (error instanceof Error ? error.message : String(error)));
		}
	});

	// Register our copyAsPromptFromSelection command
	const copySelectionDisposable = vscode.commands.registerCommand('copyforllm.copyAsPromptFromSelection', async () => {
		try {
			// Get the active text editor
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage('No active text editor found.');
				return;
			}

			// Get the selected text
			const selection = editor.selection;
			if (selection.isEmpty) {
				vscode.window.showErrorMessage('No text selected. Please select some text first.');
				return;
			}

			// Get the document and file path
			const document = editor.document;
			const filePath = document.uri.fsPath;
			
			// Get the selected text
			const selectedText = document.getText(selection);
			
			// Format as markdown with full path
			const markdownContent = formatFileAsMarkdown(filePath, selectedText);
			
			// Copy to clipboard
			await vscode.env.clipboard.writeText(markdownContent);
			
			vscode.window.showInformationMessage('Selected text copied to clipboard as Markdown!');
		} catch (error) {
			console.error('Error in copyAsPromptFromSelection command:', error);
			vscode.window.showErrorMessage('Failed to copy selection: ' + (error instanceof Error ? error.message : String(error)));
		}
	});

	context.subscriptions.push(helloWorldDisposable);
	context.subscriptions.push(copyFilesDisposable);
	context.subscriptions.push(copySelectionDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
