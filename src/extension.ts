// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// Maximum size for a file to be processed (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
// Maximum total content size for clipboard (50MB)
const MAX_CLIPBOARD_SIZE = 50 * 1024 * 1024;

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
								
								// Get file name with relative path from the selected directory
								const relativePath = path.relative(itemUri.fsPath, filePath);
								
								// Detect language for syntax highlighting
								const language = detectLanguage(filePath);
								
								// Format as markdown
								const fileMarkdown = `**${relativePath}**\n\n\`\`\`${language}\n${fileContent}\n\`\`\`\n\n`;
								markdownContent += fileMarkdown;
								totalContentSize += fileMarkdown.length;
								processedFiles++;
							} catch (fileError) {
								console.error(`Error processing file ${filePath}:`, fileError);
								skippedFiles++;
							}
						}
					} else {
						// It's a file, process it directly
						totalFiles++;
						
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
						
						// Get file name
						const fileName = path.basename(itemUri.fsPath);
						
						// Detect language for syntax highlighting
						const language = detectLanguage(itemUri.fsPath);
						
						// Format as markdown
						const fileMarkdown = `**${fileName}**\n\n\`\`\`${language}\n${fileContent}\n\`\`\`\n\n`;
						markdownContent += fileMarkdown;
						totalContentSize += fileMarkdown.length;
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

	context.subscriptions.push(helloWorldDisposable);
	context.subscriptions.push(copyFilesDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
