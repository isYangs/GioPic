const urlPattern = /^https?:\/\/.*/;
const tokenPattern = /^\d+\|[A-Za-z0-9]{40}$/;

/**
 * 验证URL是否合法
 * @param url - 待验证的URL
 * @returns 如果URL合法，返回true；否则返回错误信息
 */
export const validateUrl = (url: string) => {
    if (!url) {
        return new Error('API地址不能为空');
    } else if (!urlPattern.test(url)) {
        return new Error('请输入正确的API地址，必须包含http://或https://');
    }
    return true;
};

/**
 * 验证Token是否有效
 *
 * @param token - 要验证的Token
 * @returns 如果Token有效，返回true；否则返回错误信息
 */
export const validateToken = (token: string) => {
    if (!token) {
        return new Error('Token不能为空');
    } else if (!tokenPattern.test(token)) {
        return new Error('Token格式不正确，请参考示例格式填写！');
    }
    return true;
};

/**
 * 验证背景图URL是否合法。
 *
 * @param bgImgUrl - 需要验证的背景图 URL。
 * @returns 如果URL合法，返回true；否则返回错误信息
 */
export const validateBgImgUrl = (bgImgUrl: string) => {
    if (!bgImgUrl) {
        return new Error('背景图地址不能为空');
    } else if (!urlPattern.test(bgImgUrl)) {
        return new Error('请输入正确的URL地址，并且保证图片可以正常访问');
    }
    return true;
};

/**
 * 验证存储策略是否合法
 *
 * @param strategiesVal - 需要验证的存储策略的值
 * @returns 如果存储策略的值合法，返回true；否则返回错误信息
 */
export const validateStrategiesVal = (strategiesVal: number | null) => {
    if (!strategiesVal && strategiesVal !== 0) {
        return new Error('存储策略不能为空');
    }
    return true;
};

/**
 * 验证图片链接格式是否合法
 *
 * @param imgLinkFormatVal - 需要验证的图片链接格式的值
 * @returns 如果图片链接格式的值合法，返回true；否则返回错误信息
 */
export const validateImgLinkFormatVal = (imgLinkFormatVal: string[]) => {
    if (!imgLinkFormatVal || imgLinkFormatVal.length === 0) {
        return new Error('图片链接格式不能为空');
    }
    return true;
};

/**
 * 验证上传记录文件存储路径是否合法
 * @param recordSavePath 上传记录文件存储路径
 * @returns 如果存储路径合法，返回true；否则返回错误信息
 */
export const validateLogPath = (recordSavePath: string) => {
    if (!recordSavePath) {
        return new Error('上传记录文件存储路径不能为空');
    }

    const pathRegex = /^(.+)\/([^\/]+)$/;
    if (!pathRegex.test(recordSavePath)) {
        return new Error('上传记录文件存储路径格式不正确');
    }

    return true;
};
