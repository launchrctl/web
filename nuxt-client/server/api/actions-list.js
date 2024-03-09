import { promises } from 'fs';
import { dirname, relative } from 'path';
import { load } from 'js-yaml';
import { glob } from 'glob';

export default defineEventHandler(async (event) => {
  try {
    const files = await glob(`${process.cwd()}/**/action.{yaml,yml}`);
    return await Promise.all(
      files.map(async (file) => {
        try {
          const data = load(await promises.readFile(file, 'utf-8'));
          let schema = {}
          try {
            schema = load(await promises.readFile(file.replace('action.yaml', 'ui-schema.yaml'), 'utf-8'));
          } catch (error) {}
          return {
            _path: dirname(relative(process.cwd(), file)).split('/'),
            data,
            schema
          };
        } catch (error) {
          console.error(`Error reading file ${file}:`, error.message);
          return { path: file, error: error.message };
        }
      })
    );
  } catch (error) {
    console.error('Error during file processing:', error.message);
    throw error;
  }
});
