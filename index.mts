import { compare, compareSync, Options, Result } from "dir-compare";
import * as fs from 'fs';
const { COPYFILE_EXCL } = fs.constants;

const path1 = '/opt/nordic/ncs/v2.5.1';
const path2 = '/opt/nordic/ncs/v2.5.2';
const options: Options = {
    compareSize: true,
    compareDate: false,
    compareSymlink: false,
    skipSymlinks: true,
};

const res: Result = compareSync(path1, path2, options);

const resFiltered = {
    ...res,
    diffSet: res.diffSet
        .filter(d => d.state !== "equal")
        .filter(d => {
            if (! d.path1) return true;
            return ! d.path1.includes(".git");
        })
        .filter(d => {
            if (! d.path2) return true;
            return ! d.path2.includes(".git");
        })
        .filter(d => {
            if (! d.name1) return true;
            return ! d.name1.includes(".DS_Store");
        })
        .filter(d => {
            if (! d.name2) return true;
            return ! d.name2.includes(".DS_Store");
        })
}

fs.writeFileSync('result.json', JSON.stringify(resFiltered), err => {
    if (err) {
        console.error(err);
    } else {
        // file written successfully
    }
});

const resForDifferentSize = {
    ...resFiltered,
    diffSet: resFiltered.diffSet.filter(d => d.reason === "different-size")
}

try {
    resForDifferentSize.diffSet.map((diff) => {
        return fs.mkdirSync(`difftmp/${diff.path1.replace(path1, '')}`, { recursive: true }, () => {});
    });

    // await Promise.all(createFoldersPromises);

    resForDifferentSize.diffSet.forEach((diff) => {
        fs.copyFileSync(
            `${diff.path1}/${diff.name1}`,
            `difftmp/${diff.path1.replace(path1, '')}/${diff.name1}`,
            COPYFILE_EXCL
        )
    })
} catch (e) {
    throw e;
}
