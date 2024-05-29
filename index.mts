import {compare, compareSync, Difference, Options, Result} from "dir-compare";
import * as fs from 'fs';
const { COPYFILE_EXCL } = fs.constants;

// todo: ignore headers,
// todo: ignore binaries
// todo: ignore docs
const path1 = '/opt/nordic/ncs/v2.5.1';
const path2 = '/opt/nordic/ncs/v2.6.0';
const options: Options = {
    compareSize: true, // todo: back to true
    compareDate: false,
    compareSymlink: false,
    skipSymlinks: true,
};

const res: Result = compareSync(path1, path2, options);

const filterCb = (d: Difference, key: 'path1' | 'path2' | 'name1' | 'name2', filter: string[]) => {
    if (! d[key]) return true; // pass if missing
    const includes = filter.reduce((includes, currentPath) => {
        if (includes) return true;
        return d[key].toLowerCase().includes(currentPath.toLowerCase());
    }, false);

    return ! includes;
}

const pathFilter = [
    '.git',
    'test', // any "test" like "testing", "Tests" etc
    'example', // "Example", "/examples" etc
    'drivers',
    'docs',
    'doc',
    '.DS_Store',
    '.vscode',

    'ChangeLog.d',

    'doxygen', // Doxygen, a documentation generator tool

    'make_inc', // in this dir will be files with wthat to "include" (.c files or other)
    // 'sample',
];

const nameFilter = [
    'CODEOWNERS', // maybe we want to keep this?
    'LICENSE',
    'LICENCE',
    'ChangeLog',
    'README',
    'ds_store', // DS_Store
    '.c', // .c, .cpp
    '.h',
    '.py',
    '.sh',
    '.sql',
    '.rs', // rust source code
    '.fmt', // looks like other source code, C/C++ like
    '.java', // java sources, relates to matter
    '.ts',
    '.js',
    '.kt', // kotlin source
    '.mm', // source code (Objective-C++)
    '.icf', // C/C++ like source
    '.ipp', // from c++, store inline function definitions (source code)
    '.proto', // Protobuf
    '.emb', // Embedded Memory Blocks, data that is to be loaded into the embedded memory

    '.sct', // todo: check out what is it
    '.a', // some binaries
    '.bin', // binaries
    '.ld', // todo: check out what is it
    '.lib', // static libraries (like .dll)
    '.pl', // Perl files
    '.bat', // batch script files
    '.bash', // script files
    '.zsh', // script files

    '.bazel', // used by the Bazel build system
    '.bazelrc',
    '.bzl', // python scripts, related to bazel
    '.gn', // Generate Ninja build system files
    '.bp', // android build system
    '.der', // binary files that contain encoded digital certificates or public keys

    '.patch', // kind of git diff for source code
    '.diff', // kind of git diff for source code

    '.zap', // kind of ms deployment configs
    '.matter', // IDLs that are generated automatically by ZAP.
    '.def', // definitions for DLLs etc

    '.jpg',
    '.png',
    '.gif',
    '.svg',
    '.webp',

    '.git', // gitignore, gitattributes
    '.prettierignore',
    '.prettierrc',
    '.eslintrc',

    '.xml',
    '.yaml',
    '.yml',
    '.toml',
    '.lock',

    '.readthedocs',
    '.doc',
    '.svd', // other kind of docs
    'Doxyfile', // docs
    '.jinja', // Templating engine files

    '.vcxproj',
    '.pbxproj', // Xcode
    '.sln',

    '.pem', // no keys analyzing
    '.key',

    'Dockerfile',
    'Jenkinsfile',

    // todo: maybe we want see them? ignored for now as there are lot of them
    // 'Kconfig', // exclude all Kconfig(s);
    // 'CMakeLists',
    // 'Makefile',
    // '.mk', // other makefiles

    '.dts', // device tree files

    '.inc', // includes
    '.in', // includes

    '.build',
    '.overlay', // boards overlay

    '.rst', // tech docs
    '.md',

    '.S', // specific files, idk what is for

    '.fish', // fish shell scripts
    '.vsd', // MS Visio files
    '.drawio', // MS Visio files


]

const resFiltered = {
    ...res,
    diffSet: res.diffSet
        .filter(d => d.state !== "equal")

        .filter(d => filterCb(d, 'path1', pathFilter))
        .filter(d => filterCb(d, 'path2', pathFilter))

        .filter(d => filterCb(d, 'name1', nameFilter))
        .filter(d => filterCb(d, 'name2', nameFilter))


        // filter out just missing directories
        .filter(d => ! (d.type1 === "missing" && d.type2 === "directory"))
        .filter(d => ! (d.type2 === "missing" && d.type1 === "directory"))

        // .filter(d => { // todo: remove later, have for now
        //     return ! (d.type1 === "missing" || d.type2 === "missing")
        // })
}

const leftExtensions = new Set<string>();
const leftExtensionsCount = {};
let withoutExtensionCount = 0;
resFiltered.diffSet.map(d => {
    if (d.name1) {
        const split = d.name1.split('.');

        if (split.length > 1) {
            const extension = split[split.length - 1];
            leftExtensions.add(extension);

            // @ts-ignore
            if (! leftExtensionsCount[extension]) {
                // @ts-ignore
                leftExtensionsCount[extension] = 1
            } else {
                // @ts-ignore
                leftExtensionsCount[extension] = leftExtensionsCount[extension] + 1
            }
        } else { withoutExtensionCount = withoutExtensionCount +1 }
    }
    if (d.name2) {
        const split = d.name2.split('.');

        if (split.length > 1) {
            const extension = split[split.length - 1];
            leftExtensions.add(extension);

            // @ts-ignore
            if (! leftExtensionsCount[extension]) {
                // @ts-ignore
                leftExtensionsCount[extension] = 1
            } else {
                // @ts-ignore
                leftExtensionsCount[extension] = leftExtensionsCount[extension] + 1
            }
        } else { withoutExtensionCount = withoutExtensionCount +1 }
    }
})



const pathTokens = new Set<string>();
resFiltered.diffSet.map(d => {
    if (d.path1) {
        const split = d.path1.split('/');
        split.map(entry => pathTokens.add(entry));
    }
    if (d.path2) {
        const split = d.path2.split('/');
        split.map(entry => pathTokens.add(entry));
    }
})

fs.writeFileSync('result-pathTokens.json', JSON.stringify([...pathTokens].sort()));
fs.writeFileSync('result-leftExtensions.json', JSON.stringify([...leftExtensions].sort()));
fs.writeFileSync('result.json', JSON.stringify(resFiltered), (err: any) => {
    if (err) {
        console.error(err);
    } else {
        // file written successfully
    }
});

// @ts-ignore
console.log('leftExtensionsCount: ', Object.fromEntries(
    // @ts-ignore
    Object.entries(leftExtensionsCount).sort(([,a],[,b]) => a-b)));

console.log('Without extension count: ', withoutExtensionCount);
console.log('Size: ', resFiltered.diffSet.length);

// copy files that are different from path 1
try {

    const resForCopyFiles = {
        ...resFiltered,
        diffSet: resFiltered.diffSet
    }

    resForCopyFiles.diffSet.map((diff) => {
        if (! diff.path2) return;

        return fs.mkdirSync(`difftmp/${diff.relativePath}`, { recursive: true });
    });

    resForCopyFiles.diffSet.map(async (diff) => {
        if (! diff.path2) return;

        try {
            fs.copyFileSync(
                `${diff.path2}/${diff.name2}`,
                `./difftmp${diff.relativePath}/${diff.name2}`,
                COPYFILE_EXCL
            )
        } catch (e) {
            // continue; will fail on symlinks
        }
    })
} catch (e) {
    console.error('Dirs creation error: ', e);
    throw e;
}

process.exit(1);
// copy files that are different in size
try {
    const resForDifferentSize = {
        ...resFiltered,
        diffSet: resFiltered.diffSet.filter(d => d.reason === "different-size")
    }

    resForDifferentSize.diffSet.map((diff) => {
        return fs.mkdirSync(`difftmp/${diff.path2.replace(path2, '')}`, { recursive: true });
    });

    resForDifferentSize.diffSet.forEach((diff) => {
        fs.copyFileSync(
            `${diff.path2}/${diff.name2}`,
            `difftmp/${diff.path2.replace(path2, '')}/${diff.name2}`,
            COPYFILE_EXCL
        )
    })
} catch (e) {
    console.error('Dirs creation error: ', e);
    throw e;
}
