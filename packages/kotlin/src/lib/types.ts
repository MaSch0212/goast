import { ApiParameter } from '@goast/core';

export type ApiParameterWithMultipartInfo = ApiParameter & { multipart?: { name: string; isFile: boolean } };
