# ⚠️ WIP ⚠️

This Project is still a work in progress and should not yet be used in productive environments.

# GOAST

## **G**enerative **O**pen **A**PI **S**pecification **T**ransformer

GOAST is (or will be) a collection of TypeScript/JavaScript libraries to transform Open API specification files into other forms.
Main focus is currently code generation but will not be limited to it.

## Vision 🌌

The vision of this project is to provide libraries that enable developers to freely transform Open API specification files into any other form.

To achive this GOAST will go though the following steps to make it easy to extend the functionality or generate new forms of data:

1. Parse Open API specification files in the mainly used versions (2.0, 3.0, 3.1) and formats (JSON, YAML)
   - support for parsing multiple files together (e.g. from different micro services)
   - support for mixing the Open API specification versions and formats
2. Load all external references (`$ref`) from the parsed Open API specification files
   - local file references and http/https references will be supported
   - referencing different versions of Open API specifications will be supported
3. Transform the files to a more general format
   - Different versions of Open API specifications result in one unified format for further transformation
4. Create a pipeline for more transformers to append information and/or generate files or anything, really

The goal is to provide a `core` library that do all these steps but is not meant to be usable on its own.

There will be additional libraries for different languages and frameworks to generate code.
E.g. there will be a `typescript` and `angular` library for sure.
The goal here is to provide as much usable and extensible code as possible, so you can adjust the transformation as you want.

You wann to generate Stubs out of the Open API files? Sure, do it and maybe even create a Pull Request so other can benefit as well.

I am working on this project in my spare time and when I am motivated to do so, so it could take a while until this project takes of.
