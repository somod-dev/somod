export declare const notify: (data: {
    message: string;
    audience: {
        userId?: string;
        groupId?: string;
    };
}) => Promise<string>;
