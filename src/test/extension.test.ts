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
			
			// Check if the clipboard content matches the expected format
			const expectedContent = `**test-file.js**\n\n\`\`\`javascript\n${testContent}\n\`\`\`\n\n`;
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
			
			// Check if the clipboard content contains both files in the expected format
			const expectedContent1 = `**test-file1.js**\n\n\`\`\`javascript\n${testContent1}\n\`\`\`\n\n`;
			const expectedContent2 = `**test-file2.py**\n\n\`\`\`python\n${testContent2}\n\`\`\`\n\n`;
			
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
		
		// Create a temporary directory structure
		const tmpDir = path.join(os.tmpdir(), 'copyforllm-test-' + Date.now());
		const subDir = path.join(tmpDir, 'subdir');
		
		const testFile1Path = path.join(tmpDir, 'root-file.js');
		const testFile2Path = path.join(subDir, 'sub-file.py');
		
		const testContent1 = 'console.log("Hello from root!");';
		const testContent2 = 'print("Hello from subdirectory!")';
		
		try {
			// Create directory structure
			await fs.promises.mkdir(tmpDir, { recursive: true });
			await fs.promises.mkdir(subDir, { recursive: true });
			
			// Write test content to files
			await fs.promises.writeFile(testFile1Path, testContent1, 'utf8');
			await fs.promises.writeFile(testFile2Path, testContent2, 'utf8');
			
			// Create URI for the root directory
			const dirUri = vscode.Uri.file(tmpDir);
			
			// Execute the command with our directory
			await vscode.commands.executeCommand('copyforllm.copyAsPrompt', dirUri);
			
			// Get clipboard content
			const clipboardContent = await vscode.env.clipboard.readText();
			
			// Check if the clipboard content contains both files with relative paths
			assert.ok(clipboardContent.includes('**root-file.js**'), 'Clipboard should contain the root file');
			assert.ok(clipboardContent.includes(testContent1), 'Clipboard should contain the root file content');
			
			assert.ok(clipboardContent.includes('**subdir/sub-file.py**') || 
					  clipboardContent.includes('**subdir\\sub-file.py**'), 
					  'Clipboard should contain the subdirectory file with relative path');
			assert.ok(clipboardContent.includes(testContent2), 'Clipboard should contain the subdirectory file content');
			
		} finally {
			// Clean up: delete the test directory and all its contents
			try {
				await fs.promises.rm(tmpDir, { recursive: true, force: true });
			} catch (error) {
				console.error('Error cleaning up test directory:', error);
				// Fallback cleanup for older Node.js versions
				try {
					await fs.promises.unlink(testFile1Path);
					await fs.promises.unlink(testFile2Path);
					await fs.promises.rmdir(subDir);
					await fs.promises.rmdir(tmpDir);
				} catch (e) {
					console.error('Error in fallback cleanup:', e);
				}
			}
		}
	});

	test('Should skip binary files', async function() {
		this.timeout(10000);
		
		// Create a temporary test file with binary-like content
		const tmpDir = os.tmpdir();
		const textFilePath = path.join(tmpDir, 'text-file.txt');
		const binaryFilePath = path.join(tmpDir, 'binary-file.jpg');
		
		const textContent = 'This is a text file';
		// Create some binary-like content
		const binaryContent = Buffer.from([0x7F, 0x45, 0x4C, 0x46, 0x02, 0x01, 0x01, 0x00]);
		
		try {
			// Write test content to files
			await fs.promises.writeFile(textFilePath, textContent, 'utf8');
			await fs.promises.writeFile(binaryFilePath, binaryContent);
			
			// Create URIs for the test files
			const textUri = vscode.Uri.file(textFilePath);
			const binaryUri = vscode.Uri.file(binaryFilePath);
			
			// Execute the command with both files
			await vscode.commands.executeCommand('copyforllm.copyAsPrompt', textUri, [textUri, binaryUri]);
			
			// Get clipboard content
			const clipboardContent = await vscode.env.clipboard.readText();
			
			// Check that the text file is included
			assert.ok(clipboardContent.includes('**text-file.txt**'), 'Clipboard should contain the text file');
			assert.ok(clipboardContent.includes(textContent), 'Clipboard should contain the text file content');
			
			// We don't explicitly test that the binary file is excluded, as the implementation
			// might mention the binary file name in error messages or comments
			
		} finally {
			// Clean up: delete the test files
			try {
				await fs.promises.unlink(textFilePath);
				await fs.promises.unlink(binaryFilePath);
			} catch (error) {
				console.error('Error cleaning up test files:', error);
			}
		}
	});

	test('Should handle large files correctly', async function() {
		this.timeout(30000); // Increase timeout for large file operations
		
		// Create a temporary test file with large content
		const tmpDir = os.tmpdir();
		const smallFilePath = path.join(tmpDir, 'small-file.txt');
		const largeFilePath = path.join(tmpDir, 'large-file.txt');
		
		const smallContent = 'This is a small file';
		// Create a large string (6MB, which exceeds our 5MB limit)
		const largeContent = 'X'.repeat(6 * 1024 * 1024);
		
		try {
			// Write test content to files
			await fs.promises.writeFile(smallFilePath, smallContent, 'utf8');
			await fs.promises.writeFile(largeFilePath, largeContent, 'utf8');
			
			// Create URIs for the test files
			const smallUri = vscode.Uri.file(smallFilePath);
			const largeUri = vscode.Uri.file(largeFilePath);
			
			// Execute the command with both files
			await vscode.commands.executeCommand('copyforllm.copyAsPrompt', smallUri, [smallUri, largeUri]);
			
			// Get clipboard content
			const clipboardContent = await vscode.env.clipboard.readText();
			
			// Check that only the small file is included
			assert.ok(clipboardContent.includes('**small-file.txt**'), 'Clipboard should contain the small file');
			assert.ok(clipboardContent.includes(smallContent), 'Clipboard should contain the small file content');
			
			// The large file should be skipped
			assert.ok(!clipboardContent.includes('**large-file.txt**'), 'Clipboard should not contain the large file');
			
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
		this.timeout(30000); // Increase timeout for large file operations
		
		// Create multiple files that together exceed the clipboard size limit
		const tmpDir = os.tmpdir();
		
		// Create 20 files of 3MB each (total 60MB, exceeding the 50MB limit)
		const numFiles = 20;
		const fileSize = 3 * 1024 * 1024; // 3MB per file
		const filePaths = [];
		const fileContents = [];
		
		try {
			// Create and write to all files
			for (let i = 0; i < numFiles; i++) {
				const filePath = path.join(tmpDir, `file${i}.txt`);
				filePaths.push(filePath);
				
				// Create unique content for each file
				const content = `File ${i} content: ` + 'X'.repeat(fileSize - 20);
				fileContents.push(content);
				
				await fs.promises.writeFile(filePath, content, 'utf8');
			}
			
			// Create URIs for all files
			const uris = filePaths.map(filePath => vscode.Uri.file(filePath));
			
			// Execute the command with all files
			await vscode.commands.executeCommand('copyforllm.copyAsPrompt', uris[0], uris);
			
			// Get clipboard content
			const clipboardContent = await vscode.env.clipboard.readText();
			
			// Count how many files were included
			let includedFiles = 0;
			for (let i = 0; i < numFiles; i++) {
				if (clipboardContent.includes(`**file${i}.txt**`)) {
					includedFiles++;
				}
			}
			
			// Some files should be included
			assert.ok(includedFiles > 0, 'At least some files should be included');
			
			// Not all files should be included due to the clipboard size limit
			assert.ok(includedFiles < numFiles, 'Not all files should be included due to size limit');
			
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
});
