import fetch from 'node-fetch';
import inquirer from 'inquirer';
import program from 'commander';
import prettyjson from 'prettyjson';
import Headers from 'fetch-headers';

program.version('0.1.0')
    .usage('[options] <elucidateUrl>')
    .option('-d, --delete', 'Delete annotation')
    .parse(process.argv);

let annotation;
fetch(program.args[0])
    .then(
    (annotation) => {
        if (annotation.ok === false) {
            if (annotation.status === 410) {
                console.log('This annotation was already deleted.');
                return;
            }
            if (annotation.status === 404) {
                console.log('This annotation never existed.');
                return;
            }
            console.log(annotation.status);
            console.log(annotation.statusText);
            return null;
        }
        return annotation.json().then((annotationJson) => {
            console.log(prettyjson.render(annotationJson, {
                keysColor: 'blue',
                dashColor: 'magenta',
                stringColor: 'white'
            }));
            if (program.delete) {
                return inquirer.prompt({
                    name: 'confirmDelete',
                    type: 'confirm',
                    message: 'Are you sure you want to delete this?'
                }).then(answers => {
                    if (answers.confirmDelete === true) {
                        const rawetag = annotation.headers.get('eTag');
                        const etag = rawetag.substr(3, rawetag.length-4);
                        return fetch(program.args[0], {
                            method: 'DELETE',
                            headers: {
                                'If-Match': etag
                            }
                        }).then(resp => {
                            if (resp.ok) {
                                console.log('Deleted!');
                            } else {
                                console.log(resp.status);
                                console.log(resp.statusText);
                            }

                        });
                    }
                })
            }
        });
    });