#!/usr/bin/env node

import fs from "fs";
import path from "path";
import yargs from "yargs";
import Table from "cli-table3";
import inquirer from "inquirer";
import readline from "readline";
import cliProgress from "cli-progress";
import { hideBin } from "yargs/helpers";
import recursive from "recursive-readdir";
import { allFileExtensions as supportedExt } from "./supported_extension.js";

// Define the command-line options
const options = yargs(hideBin(process.argv))
  .usage("Usage: $0 <path> [--exclude=<exclude-list>] [--pageSize=<page-size>]")
  .demandCommand(1, "Please provide the file or directory path.")
  .option("exclude", {
    describe: "Comma-separated list of file or directory names to exclude",
    type: "string",
    nargs: 1,
  })
  .option("pageSize", {
    describe: "Number of rows per page",
    type: "number",
    nargs: 1,
  })
  .help("h")
  .alias("h", "help").argv;

// Get the path from the command line
let totalLines = 0;
let totalWords = 0;
let totalFiles = 0;
let totalFileSizeMB = 0;
let showSummary = false;
let filteredPathLength = 0;
const pathArg = options._[0];
const fileInformationList = [];
const pageSize = options.pageSize || 10;
const excludeList = options.exclude ? options.exclude.split(",") : [];

// Function to get file information
const getFileInfo = async (filePath) => {
  return new Promise((resolve, reject) => {
    const fileExtension = path.extname(filePath).toLowerCase();
    const fileSizeBytes = fs.statSync(filePath).size;
    const fileSizeMB = fileSizeBytes / (1024 * 1024);

    if (!supportedExt.includes(fileExtension)) {
      resolve({
        filePath,
        fileSizeMB: fileSizeMB.toFixed(2),
        lineCount: 0,
        wordCount: 0,
      });
    }

    // Read file content
    const fileContent = fs.readFileSync(filePath, "utf-8");
    let lineCount = 0;

    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity,
    });

    rl.on("line", () => (lineCount += 1));
    rl.on("close", () => {
      const wordCount = fileContent.split(/\s+/).filter(Boolean).length;

      resolve({
        filePath,
        fileSizeMB: fileSizeMB.toFixed(2),
        lineCount,
        wordCount,
      });
    });
  });
};

// Function to print the table
const printTableWithPagination = () => {
  const pages = [];
  let currentPage = 0;
  const table = new Table({});

  // Populate the table with file information
  fileInformationList.forEach((fileInfo) => {
    table.push([
      fileInfo.filePath,
      `${fileInfo.fileSizeMB} MB`,
      fileInfo.lineCount,
      fileInfo.wordCount,
    ]);
  });

  // Paginate the table
  for (let i = 0; i < table.length; i += pageSize) {
    const ntable = new Table({ head: ["File", "Size", "Lines", "Words"] });
    ntable.push(...table.slice(i, i + pageSize));
    pages.push(ntable);
  }

  // Function to display the current page
  const showTable = () => {
    console.clear();
    console.log(`Page ${currentPage + 1} of ${pages.length}`);
    console.log(currentPage[currentPage].toString());
  };

  // Function to display the summary table
  const showSummaryTable = () => {
    console.clear();
    const summaryTable = new Table();
    let totalSize = `${totalFileSizeMB.toFixed(2)} MB`;
    summaryTable.push(
      ["Total File Size", totalSize],
      ["Total Lines", totalLines],
      ["Total Words", totalWords],
      ["Total Files", totalFiles]
    );
    console.log(summaryTable.toString());
  };

  // Function to prompt the user for actions
  const promptUser = async () => {
    let choices = [];

    if (pages.length > 1) {
      choices.push("Next Page", "Previous Page");
    }

    choices.push("Toggle Summary", "Exit");

    if (showSummary) {
      showSummaryTable();
      choices = ["Toggle Table", "Exit"];
    } else {
      showTable();
    }

    // Prompt the user for an action
    const answers = await inquirer.prompt({
      type: "list",
      name: "action",
      message: "Select an option:",
      choices: choices,
    });

    switch (answers.action) {
      case "Next Page":
        currentPage = (currentPage + 1) % pages.length;
        showTable();
        promptUser();
        break;
      case "Previous Page":
        currentPage = (currentPage - 1 + pages.length) % pages.length;
        showTable();
        promptUser();
        break;
      case "Toggle Summary":
        showSummary = !showSummary;
        promptUser();
        break;
      case "Toggle Table":
        showSummary = !showSummary;
        promptUser();
        break;
      case "Exit":
        break;
    }
  };

  showTable();
  promptUser();
};

// Function to process a single file
const processSingleFile = async (filePath) => {
  const fileName = path.basename(filePath);

  // Check if the file is not in the exclude list
  if (!excludeList.some((excludedItem) => fileName.includes(excludedItem))) {
    const fileInfo = await getFileInfo(filePath);

    fileInformationList.push(fileInfo);
    totalFileSizeMB += parseFloat(fileInfo.fileSizeMB);
    totalLines += fileInfo.lineCount;
    totalWords += fileInfo.wordCount;
    totalFiles += 1;
  }
};

// Function to process files in the directory (recursively)
const processFiles = async (directoryPath) => {
  return new Promise((resolve, reject) => {
    if (fs.statSync(directoryPath).isDirectory()) {
      // Read all files in the directory
      recursive(directoryPath, async (err, files) => {
        if (err) {
          console.error(`Error reading directory: ${err.message}`);
          process.exit(1);
        }

        // Filter files based on exclusion list
        const filteredPaths = files.filter(
          (filePath) =>
            !excludeList.some((excludePath) => filePath.includes(excludePath))
        );
        filteredPathLength = filteredPaths.length;

        // Initialize the progress bar
        const progressBarPresets = cliProgress.Presets.shades_classic;
        const progressBar = new cliProgress.SingleBar({}, progressBarPresets);
        progressBar.start(filteredPathLength, 0);

        // Process each file
        for (const file of filteredPaths) {
          await processSingleFile(file);
          progressBar.increment();
        }

        progressBar.stop();
        resolve();
      });
    } else {
      // If it's a single file, process it directly
      processSingleFile(directoryPath).then(resolve);
    }
  });
};

// Start processing files
processFiles(pathArg).then(() => {
  console.log("\n");
  printTableWithPagination();
});
