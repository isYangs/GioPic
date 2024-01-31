/**
 * 将文件大小从字节或千字节转换为 KB、MB 或 GB。
 *
 * @param {number} size - 文件大小，单位可以是字节或千字节。
 * @param {boolean} isKb - 如果为 true，则 size 的单位是千字节，否则单位是字节。
 * @returns {string} 返回格式化后的文件大小，包括单位。
 * @example
 * convertFileSize(1024); // '1.00 KB'
 * convertFileSize(1024, true); // '1.00 MB'
 */
export const convertFileSize = (size: number, isKb: boolean = false) => {
    const units = isKb ? ['KB', 'MB', 'GB'] : ['Bytes', 'KB', 'MB', 'GB'];
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
};