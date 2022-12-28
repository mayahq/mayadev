export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';

type RequestBodyField = {
    title: string;
    type: string;
}

type RequestBody = {
    [key: string]: RequestBodyField | RequestBody;
}

export type NodeApiActionSpec = {
    path: string;
    method: HttpMethod;
    summary: string;
    requestBody: RequestBody;
    params: RequestBody;
    queryParams: RequestBody;
    headers: RequestBody;
    id: number;
    requiresAuth: boolean;
}

export type NodeApiSpec = {
    name: string;
    actions: {
        [key: string]: NodeApiActionSpec;
    }
}

export type ModuleSpec = {
    baseUrl: string;
    endpoints: NodeApiSpec[]
}