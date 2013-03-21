/*jslint node: true, sloppy: true */
// Super-simple Node program to minify CSS and output to stdout.
// Pass a CSS file as input, either as filename or via stdin.
var inputFile, compressAndWriteOutput;

compressAndWriteOutput = function (s) {
    var cleanCSS = require("clean-css");
    s = cleanCSS.process(s);
    process.stdout.write(s);
};

if (process.argv[2]) {
    inputFile = require("fs").readFileSync(process.argv[2], { encoding: "utf8" });
    compressAndWriteOutput(inputFile);
} else {
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", function (chunk) {
        compressAndWriteOutput(chunk);
    });
}
