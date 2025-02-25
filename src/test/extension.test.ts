import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('Command copyforllm.copyAsPrompt should execute without error', async () => {
		// Try to execute the command
		try {
			await vscode.commands.executeCommand('copyforllm.copyAsPrompt');
			assert.ok(true, 'Command executed successfully');
		} catch (error) {
			assert.fail(`Command execution failed: ${error}`);
		}
	});

	test('Markdown formatting should work correctly with a test file', async function() {
		this.timeout(10000); // Increase timeout for file operations
		
		// Create a temporary test file
		const tmpDir = os.tmpdir();
		const testFilePath = path.join(tmpDir, 'test-file.js');
		const testContent = 'console.log("Hello, world!");';
		
		try {
			// Write test content to file
			await fs.promises.writeFile(testFilePath, testContent, 'utf8');
			
			// Create URI for the test file
			const uri = vscode.Uri.file(testFilePath);
			
			// Execute the command with our test file
			await vscode.commands.executeCommand('copyforllm.copyAsPrompt', uri);
			
			// Get clipboard content
			const clipboardContent = await vscode.env.clipboard.readText();
			
			// Normalize path for comparison
			let normalizedPath = testFilePath;
			if (process.platform === 'win32') {
				// Ensure consistent casing for drive letter (always uppercase)
				if (/^[a-z]:/.test(normalizedPath)) {
					normalizedPath = normalizedPath.charAt(0).toUpperCase() + normalizedPath.slice(1);
				}
				// Ensure consistent backslashes
				normalizedPath = normalizedPath.replace(/\\/g, '\\\\');
			}
			
			// Check if the clipboard content matches the expected format with full path
			const expectedContent = `**${normalizedPath}**\n\n\`\`\`javascript\n${testContent}\n\`\`\`\n\n`;
			assert.strictEqual(clipboardContent, expectedContent, 'Clipboard content should match expected Markdown format');
			
		} finally {
			// Clean up: delete the test file
			try {
				await fs.promises.unlink(testFilePath);
			} catch (error) {
				console.error('Error cleaning up test file:', error);
			}
		}
	});

	test('Should handle multiple files correctly', async function() {
		this.timeout(15000); // Increase timeout for multiple file operations
		
		// Create temporary test files
		const tmpDir = os.tmpdir();
		const testFile1Path = path.join(tmpDir, 'test-file1.js');
		const testFile2Path = path.join(tmpDir, 'test-file2.py');
		
		const testContent1 = 'console.log("Hello from JavaScript!");';
		const testContent2 = 'print("Hello from Python!")';
		
		try {
			// Write test content to files
			await fs.promises.writeFile(testFile1Path, testContent1, 'utf8');
			await fs.promises.writeFile(testFile2Path, testContent2, 'utf8');
			
			// Create URIs for the test files
			const uri1 = vscode.Uri.file(testFile1Path);
			const uri2 = vscode.Uri.file(testFile2Path);
			
			// Execute the command with our test files (simulating multi-selection)
			// Note: We're passing the first URI as the main argument and an array with both URIs
			// as the second argument, which is how VS Code passes multiple selections
			await vscode.commands.executeCommand('copyforllm.copyAsPrompt', uri1, [uri1, uri2]);
			
			// Get clipboard content
			const clipboardContent = await vscode.env.clipboard.readText();
			
			// Normalize paths for comparison
			const normalizedPath1 = normalizePath(testFile1Path);
			const normalizedPath2 = normalizePath(testFile2Path);
			
			// Check if the clipboard content contains both files in the expected format with full paths
			const expectedContent1 = `**${normalizedPath1}**\n\n\`\`\`javascript\n${testContent1}\n\`\`\`\n\n`;
			const expectedContent2 = `**${normalizedPath2}**\n\n\`\`\`python\n${testContent2}\n\`\`\`\n\n`;
			
			assert.ok(clipboardContent.includes(expectedContent1), 'Clipboard should contain the first file content');
			assert.ok(clipboardContent.includes(expectedContent2), 'Clipboard should contain the second file content');
			
		} finally {
			// Clean up: delete the test files
			try {
				await fs.promises.unlink(testFile1Path);
				await fs.promises.unlink(testFile2Path);
			} catch (error) {
				console.error('Error cleaning up test files:', error);
			}
		}
	});

	test('Should handle directories recursively', async function() {
		this.timeout(20000); // Increase timeout for directory operations
		
		// Create a temporary test directory with files
		const tmpDir = os.tmpdir();
		const testDirPath = path.join(tmpDir, 'test-dir-' + Date.now());
		const subDirPath = path.join(testDirPath, 'subdir');
		const rootFilePath = path.join(testDirPath, 'root-file.js');
		const subFilePath = path.join(subDirPath, 'sub-file.js');
		
		const rootContent = 'console.log("Root file");';
		const subContent = 'console.log("Sub file");';
		
		try {
			// Create directory structure
			await fs.promises.mkdir(testDirPath, { recursive: true });
			await fs.promises.mkdir(subDirPath, { recursive: true });
			
			// Write test content to files
			await fs.promises.writeFile(rootFilePath, rootContent, 'utf8');
			await fs.promises.writeFile(subFilePath, subContent, 'utf8');
			
			// Create URI for the test directory
			const uri = vscode.Uri.file(testDirPath);
			
			// Execute the command with our test directory
			await vscode.commands.executeCommand('copyforllm.copyAsPrompt', uri);
			
			// Get clipboard content
			const clipboardContent = await vscode.env.clipboard.readText();
			
			// Normalize paths for comparison
			const normalizedRootPath = normalizePath(rootFilePath);
			const normalizedSubPath = normalizePath(subFilePath);
			
			// Check if the clipboard content contains both files
			const expectedRootContent = `**${normalizedRootPath}**\n\n\`\`\`javascript\n${rootContent}\n\`\`\`\n\n`;
			const expectedSubContent = `**${normalizedSubPath}**\n\n\`\`\`javascript\n${subContent}\n\`\`\`\n\n`;
			
			assert.ok(clipboardContent.includes(expectedRootContent), 'Clipboard should contain the root file');
			assert.ok(clipboardContent.includes(expectedSubContent), 'Clipboard should contain the sub file');
			
		} finally {
			// Clean up: delete the test directory and its contents
			try {
				await fs.promises.rm(testDirPath, { recursive: true, force: true });
			} catch (error) {
				console.error('Error cleaning up test directory:', error);
			}
		}
	});

	test('Should skip binary files', async function() {
		this.timeout(15000); // Increase timeout for file operations
		
		// Create temporary test files
		const tmpDir = os.tmpdir();
		const testTextPath = path.join(tmpDir, 'test-text.js');
		const testBinaryPath = path.join(tmpDir, 'test-binary.jpg'); // Using a common binary extension
		
		const textContent = 'console.log("This is a text file");';
		const binaryContent = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]); // JPEG file signature
		
		try {
			// Write test content to files
			await fs.promises.writeFile(testTextPath, textContent, 'utf8');
			await fs.promises.writeFile(testBinaryPath, binaryContent);
			
			// Create URIs for the test files
			const uri1 = vscode.Uri.file(testTextPath);
			const uri2 = vscode.Uri.file(testBinaryPath);
			
			// Execute the command with our test files
			await vscode.commands.executeCommand('copyforllm.copyAsPrompt', uri1, [uri1, uri2]);
			
			// Get clipboard content
			const clipboardContent = await vscode.env.clipboard.readText();
			
			// Normalize path for comparison
			const normalizedTextPath = normalizePath(testTextPath);
			
			// Check if the clipboard content contains only the text file
			const expectedTextContent = `**${normalizedTextPath}**\n\n\`\`\`javascript\n${textContent}\n\`\`\`\n\n`;
			
			assert.ok(clipboardContent.includes(expectedTextContent), 'Clipboard should contain the text file');
			
			// The binary file should not be included in the content
			// We'll check that the binary file path is not in the clipboard content
			assert.ok(!clipboardContent.includes(`**${testBinaryPath}`), 'Clipboard should not contain the binary file');
			
		} finally {
			// Clean up: delete the test files
			try {
				await fs.promises.unlink(testTextPath);
				await fs.promises.unlink(testBinaryPath);
			} catch (error) {
				console.error('Error cleaning up test files:', error);
			}
		}
	});

	test('Should handle large files correctly', async function() {
		this.timeout(15000); // Increase timeout for large file operations
		
		// Create temporary test files
		const tmpDir = os.tmpdir();
		const smallFilePath = path.join(tmpDir, 'small-file.js');
		const largeFilePath = path.join(tmpDir, 'large-file.txt');
		
		const smallContent = 'console.log("This is a small file");';
		// Create a large content (> 5MB)
		const largeContent = 'a'.repeat(6 * 1024 * 1024); // 6MB of 'a's
		
		try {
			// Write test content to files
			await fs.promises.writeFile(smallFilePath, smallContent, 'utf8');
			await fs.promises.writeFile(largeFilePath, largeContent, 'utf8');
			
			// Create URIs for the test files
			const uri1 = vscode.Uri.file(smallFilePath);
			const uri2 = vscode.Uri.file(largeFilePath);
			
			// Execute the command with our test files
			await vscode.commands.executeCommand('copyforllm.copyAsPrompt', uri1, [uri1, uri2]);
			
			// Get clipboard content
			const clipboardContent = await vscode.env.clipboard.readText();
			
			// Normalize path for comparison
			const normalizedSmallPath = normalizePath(smallFilePath);
			
			// Check if the clipboard content contains only the small file
			const expectedSmallContent = `**${normalizedSmallPath}**\n\n\`\`\`javascript\n${smallContent}\n\`\`\`\n\n`;
			
			assert.ok(clipboardContent.includes(expectedSmallContent), 'Clipboard should contain the small file');
			assert.ok(!clipboardContent.includes('large-file.txt'), 'Clipboard should not contain the large file content');
			
		} finally {
			// Clean up: delete the test files
			try {
				await fs.promises.unlink(smallFilePath);
				await fs.promises.unlink(largeFilePath);
			} catch (error) {
				console.error('Error cleaning up test files:', error);
			}
		}
	});

	test('Should detect language correctly based on file extension', async function() {
		this.timeout(10000);
		
		// Create temporary test files with different extensions
		const tmpDir = os.tmpdir();
		const jsFilePath = path.join(tmpDir, 'test-file.js');
		const pyFilePath = path.join(tmpDir, 'test-file.py');
		const unknownFilePath = path.join(tmpDir, 'test-file.xyz'); // Unknown extension
		
		const testContent = 'Test content';
		
		try {
			// Write test content to files
			await fs.promises.writeFile(jsFilePath, testContent, 'utf8');
			await fs.promises.writeFile(pyFilePath, testContent, 'utf8');
			await fs.promises.writeFile(unknownFilePath, testContent, 'utf8');
			
			// Create URIs for the test files
			const jsUri = vscode.Uri.file(jsFilePath);
			const pyUri = vscode.Uri.file(pyFilePath);
			const unknownUri = vscode.Uri.file(unknownFilePath);
			
			// Execute the command with all files
			await vscode.commands.executeCommand('copyforllm.copyAsPrompt', jsUri, [jsUri, pyUri, unknownUri]);
			
			// Get clipboard content
			const clipboardContent = await vscode.env.clipboard.readText();
			
			// Check that the language is correctly detected for each file
			assert.ok(clipboardContent.includes('```javascript'), 'JavaScript language should be detected for .js file');
			assert.ok(clipboardContent.includes('```python'), 'Python language should be detected for .py file');
			assert.ok(clipboardContent.includes('```\nTest content'), 'Unknown extension should have no language specified');
			
		} finally {
			// Clean up: delete the test files
			try {
				await fs.promises.unlink(jsFilePath);
				await fs.promises.unlink(pyFilePath);
				await fs.promises.unlink(unknownFilePath);
			} catch (error) {
				console.error('Error cleaning up test files:', error);
			}
		}
	});

	test('Should respect total clipboard size limit', async function() {
		this.timeout(30000); // Increase timeout for multiple large file operations
		
		// Create multiple files that together exceed the clipboard size limit
		const tmpDir = os.tmpdir();
		const numFiles = 10;
		const filePaths = [];
		const fileContents = [];
		
		// Each file will be about 5MB, so 10 files would be ~50MB, exceeding our limit
		const fileSize = 5 * 1024 * 1024;
		
		try {
			// Create the test files
			for (let i = 0; i < numFiles; i++) {
				const filePath = path.join(tmpDir, `test-file-${i}.txt`);
				filePaths.push(filePath);
				
				// Create content with a unique identifier at the beginning
				const content = `File ${i}: ` + 'X'.repeat(fileSize - 10);
				fileContents.push(content);
				
				await fs.promises.writeFile(filePath, content, 'utf8');
			}
			
			// Create URIs for all files
			const uris = filePaths.map(fp => vscode.Uri.file(fp));
			
			// Execute the command with all files
			await vscode.commands.executeCommand('copyforllm.copyAsPrompt', uris[0], uris);
			
			// Get clipboard content
			const clipboardContent = await vscode.env.clipboard.readText();
			
			// Check that at least some files are included
			let filesIncluded = 0;
			for (let i = 0; i < numFiles; i++) {
				const normalizedPath = normalizePath(filePaths[i]);
				if (clipboardContent.includes(`**${normalizedPath}**`)) {
					filesIncluded++;
				}
			}
			
			// We should have at least one file, but not all files due to the size limit
			assert.ok(filesIncluded > 0, 'At least some files should be included');
			assert.ok(filesIncluded < numFiles, 'Not all files should be included due to size limit');
			
		} finally {
			// Clean up: delete all test files
			for (const filePath of filePaths) {
				try {
					await fs.promises.unlink(filePath);
				} catch (error) {
					console.error(`Error cleaning up test file ${filePath}:`, error);
				}
			}
		}
	});

	test('Should include full path in file header', async function() {
		this.timeout(10000); // Increase timeout for file operations
		
		// Create a temporary test file
		const tmpDir = os.tmpdir();
		const testFilePath = path.join(tmpDir, 'test-file.js');
		const testContent = 'console.log("Hello, world!");';
		
		try {
			// Write test content to file
			await fs.promises.writeFile(testFilePath, testContent, 'utf8');
			
			// Create URI for the test file
			const uri = vscode.Uri.file(testFilePath);
			
			// Execute the command with our test file
			await vscode.commands.executeCommand('copyforllm.copyAsPrompt', uri);
			
			// Get clipboard content
			const clipboardContent = await vscode.env.clipboard.readText();
			
			// Check if the clipboard content includes the full path
			// We expect the format to be "**/path/to/test-file.js**"
			const fileName = path.basename(testFilePath);
			const normalizedPath = normalizePath(testFilePath);
			const expectedPathPattern = new RegExp(`\\*\\*.*${fileName}\\*\\*`);
			
			assert.ok(expectedPathPattern.test(clipboardContent), 'Clipboard content should include the full path in the header');
			assert.ok(clipboardContent.includes(normalizedPath), 'Clipboard content should include the normalized path');
			
		} finally {
			// Clean up: delete the test file
			try {
				await fs.promises.unlink(testFilePath);
			} catch (error) {
				console.error('Error cleaning up test file:', error);
			}
		}
	});

	test('Should use custom separator between files', async function() {
		this.timeout(15000); // Increase timeout for file operations
		
		// Create temporary test files
		const tmpDir = os.tmpdir();
		const testFile1Path = path.join(tmpDir, 'test-file1.js');
		const testFile2Path = path.join(tmpDir, 'test-file2.py');
		
		const testContent1 = 'console.log("Hello from JavaScript!");';
		const testContent2 = 'print("Hello from Python!")';
		
		try {
			// Write test content to files
			await fs.promises.writeFile(testFile1Path, testContent1, 'utf8');
			await fs.promises.writeFile(testFile2Path, testContent2, 'utf8');
			
			// Create URIs for the test files
			const uri1 = vscode.Uri.file(testFile1Path);
			const uri2 = vscode.Uri.file(testFile2Path);
			
			// Set custom separator in configuration
			await vscode.workspace.getConfiguration('copyforllm').update('separator', '---', vscode.ConfigurationTarget.Global);
			
			// Execute the command with our test files
			await vscode.commands.executeCommand('copyforllm.copyAsPrompt', uri1, [uri1, uri2]);
			
			// Get clipboard content
			const clipboardContent = await vscode.env.clipboard.readText();
			
			// Normalize paths for comparison
			const normalizedPath1 = normalizePath(testFile1Path);
			const normalizedPath2 = normalizePath(testFile2Path);
			
			// Check if the clipboard content contains the custom separator between files
			const file1Content = `**${normalizedPath1}**\n\n\`\`\`javascript\n${testContent1}\n\`\`\`\n\n`;
			const file2Content = `**${normalizedPath2}**\n\n\`\`\`python\n${testContent2}\n\`\`\`\n\n`;
			const expectedContent = file1Content + '---\n' + file2Content;
			
			assert.ok(clipboardContent.includes('---\n'), 'Clipboard should contain the custom separator');
			
			// Reset configuration to default
			await vscode.workspace.getConfiguration('copyforllm').update('separator', undefined, vscode.ConfigurationTarget.Global);
			
		} finally {
			// Clean up: delete the test files
			try {
				await fs.promises.unlink(testFile1Path);
				await fs.promises.unlink(testFile2Path);
			} catch (error) {
				console.error('Error cleaning up test files:', error);
			}
		}
	});

	test('Should use custom header format', async function() {
		this.timeout(10000); // Increase timeout for file operations
		
		// Create a temporary test file
		const tmpDir = os.tmpdir();
		const testFilePath = path.join(tmpDir, 'test-file.js');
		const testContent = 'console.log("Hello, world!");';
		
		try {
			// Write test content to file
			await fs.promises.writeFile(testFilePath, testContent, 'utf8');
			
			// Create URI for the test file
			const uri = vscode.Uri.file(testFilePath);
			
			// Set custom header format in configuration
			await vscode.workspace.getConfiguration('copyforllm').update('headerFormat', '## File: {filePath}', vscode.ConfigurationTarget.Global);
			
			// Execute the command with our test file
			await vscode.commands.executeCommand('copyforllm.copyAsPrompt', uri);
			
			// Get clipboard content
			const clipboardContent = await vscode.env.clipboard.readText();
			
			// Normalize path for comparison
			const normalizedPath = normalizePath(testFilePath);
			
			// Check if the clipboard content uses the custom header format
			const expectedHeader = `## File: ${normalizedPath}`;
			
			assert.ok(clipboardContent.includes(expectedHeader), 'Clipboard should use the custom header format');
			assert.ok(!clipboardContent.includes(`**${normalizedPath}**`), 'Clipboard should not use the default header format');
			
			// Reset configuration to default
			await vscode.workspace.getConfiguration('copyforllm').update('headerFormat', undefined, vscode.ConfigurationTarget.Global);
			
		} finally {
			// Clean up: delete the test file
			try {
				await fs.promises.unlink(testFilePath);
			} catch (error) {
				console.error('Error cleaning up test file:', error);
			}
		}
	});

	test('Should ignore files based on extension patterns', async function() {
		this.timeout(15000); // Increase timeout for file operations
		
		// Create temporary test files
		const tmpDir = os.tmpdir();
		const jsFilePath = path.join(tmpDir, 'test-file.js');
		const envFilePath = path.join(tmpDir, 'test-file.env');
		
		const jsContent = 'console.log("This is a JavaScript file");';
		const envContent = 'API_KEY=1234567890';
		
		try {
			// Write test content to files
			await fs.promises.writeFile(jsFilePath, jsContent, 'utf8');
			await fs.promises.writeFile(envFilePath, envContent, 'utf8');
			
			// Create URIs for the test files
			const uri1 = vscode.Uri.file(jsFilePath);
			const uri2 = vscode.Uri.file(envFilePath);
			
			// Set ignored extensions in configuration
			await vscode.workspace.getConfiguration('copyforllm').update('ignoredExtensions', ['.env'], vscode.ConfigurationTarget.Global);
			
			// Execute the command with our test files
			await vscode.commands.executeCommand('copyforllm.copyAsPrompt', uri1, [uri1, uri2]);
			
			// Get clipboard content
			const clipboardContent = await vscode.env.clipboard.readText();
			
			// Normalize path for comparison
			const normalizedJsPath = normalizePath(jsFilePath);
			const normalizedEnvPath = normalizePath(envFilePath);
			
			// Check if the clipboard content contains only the JavaScript file
			assert.ok(clipboardContent.includes(normalizedJsPath), 'Clipboard should contain the JavaScript file');
			assert.ok(!clipboardContent.includes(normalizedEnvPath), 'Clipboard should not contain the .env file');
			
			// Reset configuration to default
			await vscode.workspace.getConfiguration('copyforllm').update('ignoredExtensions', undefined, vscode.ConfigurationTarget.Global);
			
		} finally {
			// Clean up: delete the test files
			try {
				await fs.promises.unlink(jsFilePath);
				await fs.promises.unlink(envFilePath);
			} catch (error) {
				console.error('Error cleaning up test files:', error);
			}
		}
	});

	test('Should mask sensitive content', async function() {
		this.timeout(10000); // Increase timeout for file operations
		
		// Create a temporary test file with sensitive content
		const tmpDir = os.tmpdir();
		const testFilePath = path.join(tmpDir, 'config.js');
		const testContent = `
			const config = {
				apiKey: "1234567890abcdef",
				password: "supersecret",
				username: "admin",
				url: "https://api.example.com"
			};
		`;
		
		try {
			// Write test content to file
			await fs.promises.writeFile(testFilePath, testContent, 'utf8');
			
			// Create URI for the test file
			const uri = vscode.Uri.file(testFilePath);
			
			// Set sensitive patterns in configuration
			await vscode.workspace.getConfiguration('copyforllm').update('sensitivePatterns', [
				{ pattern: 'apiKey: "[^"]*"', replacement: 'apiKey: "****"' },
				{ pattern: 'password: "[^"]*"', replacement: 'password: "****"' }
			], vscode.ConfigurationTarget.Global);
			
			// Execute the command with our test file
			await vscode.commands.executeCommand('copyforllm.copyAsPrompt', uri);
			
			// Get clipboard content
			const clipboardContent = await vscode.env.clipboard.readText();
			
			// Check if the clipboard content has masked the sensitive content
			assert.ok(clipboardContent.includes('apiKey: "****"'), 'Clipboard should mask API key');
			assert.ok(clipboardContent.includes('password: "****"'), 'Clipboard should mask password');
			assert.ok(!clipboardContent.includes('1234567890abcdef'), 'Clipboard should not contain the actual API key');
			assert.ok(!clipboardContent.includes('supersecret'), 'Clipboard should not contain the actual password');
			assert.ok(clipboardContent.includes('username: "admin"'), 'Clipboard should keep non-sensitive content');
			
			// Reset configuration to default
			await vscode.workspace.getConfiguration('copyforllm').update('sensitivePatterns', undefined, vscode.ConfigurationTarget.Global);
			
		} finally {
			// Clean up: delete the test file
			try {
				await fs.promises.unlink(testFilePath);
			} catch (error) {
				console.error('Error cleaning up test file:', error);
			}
		}
	});

	test('Should copy only selected text when using copyAsPromptFromSelection', async function() {
		this.timeout(15000); // Increase timeout for file operations
		
		// Check if the command exists
		const commands = await vscode.commands.getCommands();
		if (!commands.includes('copyforllm.copyAsPromptFromSelection')) {
			console.log('Command copyforllm.copyAsPromptFromSelection not found, skipping test');
			this.skip();
			return;
		}
		
		// Create a temporary test file with multiple lines
		const tmpDir = os.tmpdir();
		const testFilePath = path.join(tmpDir, 'multiline.js');
		const testContent = `// Line 1
// Line 2
// Line 3
function test() {
  // Line 5
  console.log("Hello");
  // Line 7
  return true;
  // Line 9
}
// Line 11`;
		
		try {
			// Write test content to file
			await fs.promises.writeFile(testFilePath, testContent, 'utf8');
			
			// Create URI for the test file
			const uri = vscode.Uri.file(testFilePath);
			
			// Open the document
			const document = await vscode.workspace.openTextDocument(uri);
			const editor = await vscode.window.showTextDocument(document);
			
			// Create a selection (lines 4-8)
			const startPos = new vscode.Position(3, 0); // Line 4 (0-indexed), column 0
			const endPos = new vscode.Position(8, 0);   // Line 9 (0-indexed), column 0
			const selection = new vscode.Selection(startPos, endPos);
			
			// Set the editor selection
			editor.selection = selection;
			
			// Execute the command with our selection
			await vscode.commands.executeCommand('copyforllm.copyAsPromptFromSelection');
			
			// Wait a bit for the clipboard to be updated
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			// Get clipboard content
			const clipboardContent = await vscode.env.clipboard.readText();
			console.log('Clipboard content:', clipboardContent);
			
			// Check if the clipboard content contains the selected lines
			// We're checking for the presence of key parts rather than the exact content
			assert.ok(clipboardContent.includes('function test()'), 'Clipboard should contain the function declaration');
			assert.ok(clipboardContent.includes('console.log("Hello")'), 'Clipboard should contain the console.log line');
			assert.ok(clipboardContent.includes('return true'), 'Clipboard should contain the return statement');
			assert.ok(!clipboardContent.includes('// Line 1'), 'Clipboard should not contain text before selection');
			assert.ok(!clipboardContent.includes('// Line 11'), 'Clipboard should not contain text after selection');
			
		} finally {
			// Clean up: delete the test file and close the editor
			try {
				await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
				await fs.promises.unlink(testFilePath);
			} catch (error) {
				console.error('Error cleaning up test file:', error);
			}
		}
	});
});

// Helper function to normalize paths for tests
function normalizePath(filePath: string): string {
	if (process.platform === 'win32') {
		// Ensure consistent casing for drive letter (always uppercase)
		if (/^[a-z]:/.test(filePath)) {
			filePath = filePath.charAt(0).toUpperCase() + filePath.slice(1);
		}
		// Ensure consistent backslashes
		filePath = filePath.replace(/\\/g, '\\\\');
	}
	return filePath;
}
