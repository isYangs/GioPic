<script setup lang="ts">
import { format } from 'date-fns';
import { RecordData, useAppStore } from '~/store';
import { ImgLinkFormatTabsOption, getImgLinkFormat } from '../SettingsPanel/utils';
import { unescapeHtml } from '~/utils/escape';
import { convertFileSize } from '~/utils/convert';
import { NButton, NCheckbox } from 'naive-ui';

const appStore = useAppStore();
const { isUploadRecord, strategies, recordSavePath, isUploadRecordDelDialog } = storeToRefs(appStore);
const message = useMessage();
const dialog = useDialog();
const recordData: Ref<RecordData[]> = ref([]);
const selectedFile: Ref<RecordData | null> = ref(null);
const isImageInfo = ref(false);

// 获取图片链接格式
const imgLinkFormat = computed(() => {
    const imgLinkFormatResult = getImgLinkFormat;
    return (imgLinkFormatResult || []).map((item: ImgLinkFormatTabsOption) => {
        return { ...item, key: item.value, value: undefined };
    });
});

// 监听主进程发送的获取上传记录的消息
window.ipcRenderer.on('get-ur-file-status', (_e, status, data) => {
    if (status) {
        recordData.value = data;
    }
});

// 复制链接到剪切板
const copyLinkToClipboard = (link: string) => {
    navigator.clipboard.writeText(unescapeHtml(link)).then(() => {
        message.success('复制成功');
    }).catch(() => {
        message.error('复制失败');
    });
}

// 获取链接
const getLink = (id: string, key: string = 'url') => {
    const item = recordData.value.find((item: RecordData) => item.id === id);
    if (!item || !item.links) {
        message.error('没有找到对应的链接');
        return;
    }

    const link: string = item.links[key];
    if (!link) {
        message.error('没有可以复制的图片链接');
        return;
    }

    return link;
}

// 根据策略id查找策略名称
const findStrategiesNameById = (id: number) => {
    const strategy = strategies.value.find(item => item.value === id);

    if (!strategy) {
        return '未知';
    }

    return strategy.label;
}

// 复制默认链接
const handleDefaultImgLinkFormat = (id: string) => {
    const link = getLink(id);
    if (link) {
        copyLinkToClipboard(link);
    }
}

// 复制指定格式的链接
const handleImgLinkFormatSelect = (key: string, id: string) => {
    const link = getLink(id, key);
    if (link) {
        copyLinkToClipboard(link);
    }
}

// 查看详情
const handleViewDetails = (file: RecordData) => {
    selectedFile.value = file;
    isImageInfo.value = true;
}

// 删除上传记录
const handleDelRecord = (id: string) => {
    const n = dialog.warning({
        title: '提示',
        content: '确定删除该记录吗？同时会删除图床中对应的图片。',
        autoFocus: false,
        action: () => {
            return h('div', { class: 'wh-full flex-center justify-between' }, [
                h(NCheckbox, {
                    class: 'text-3',
                    checked: isUploadRecordDelDialog.value,
                    'onUpdate:checked': (newValue: boolean) => {
                        appStore.setState({ isUploadRecordDelDialog: newValue });
                    }
                }, () => '不再显示此对话框'),
                h('div', {}, [
                    h(NButton, {
                        size: 'small',
                        class: 'mr4',
                        onClick: () => {
                            n.destroy();
                        },
                    }, {
                        default: () => '取消',
                    }),
                    h(NButton, {
                        type: 'warning',
                        size: 'small',
                        onClick: () => {
                            window.ipcRenderer.send('delete-ur-file', recordSavePath.value, id);
                            n.destroy();
                        },
                    }, {
                        default: () => '确定',
                    }),
                ])
            ]);
        }
    });
}
</script>

<template>
    <n-drawer v-model:show="isUploadRecord" :width="800" :close-on-esc="false" :auto-focus="false">
        <n-drawer-content title="上传记录" closable>
            <n-image-group v-if="recordData">
                <n-flex justify="center">
                    <n-card v-for="file in recordData" :key="file.id" hoverable class="w60 relative"
                        content-style="padding: 25px 20px 20px 20px;">
                        <n-flex v-if="file.links" class="wh-full" id="image-scroll-container" vertical>
                            <n-image class="h50" :src="file.links.url" lazy>
                                <template #placeholder>
                                    <div class="wh-full flex-center bg-[#0001]">
                                        正在加载中，稍等片刻...
                                    </div>
                                </template>
                            </n-image>
                            <n-flex justify="center">
                                <n-dropdown trigger="hover" placement="bottom-start" :options="imgLinkFormat"
                                    @select="(key: string) => handleImgLinkFormatSelect(key, file.id)">
                                    <n-button tertiary @click="handleDefaultImgLinkFormat(file.id)">复制链接</n-button>
                                </n-dropdown>
                                <n-button tertiary @click="handleViewDetails(file)">查看详情</n-button>
                            </n-flex>
                        </n-flex>
                        <n-button quaternary class="w5 h5 absolute top-1 right-1" @click="handleDelRecord(file.id)">
                            <template #icon>
                                <div class="i-ic-sharp-close text-dark-50 w5 h5"></div>
                            </template>
                        </n-button>
                    </n-card>
                </n-flex>
            </n-image-group>
            <n-empty v-else description="是一个飞机">
                <template #icon>
                    <div class="i-material-symbols-speaker-notes-off-outline" />
                </template>
                <template #extra>
                    <n-button size="small">
                        看看别的
                    </n-button>
                </template>
            </n-empty>
        </n-drawer-content>
    </n-drawer>
    <n-modal v-model:show="isImageInfo" class="custom-card w160" preset="card" title="图片详情" size="huge" :auto-focus="false">
        <n-flex v-if="selectedFile" justify="space-between" :wrap="false">
            <div class="w70 image-info">
                <p>文件名：{{ selectedFile.name }}</p>
                <n-divider />
                <p>文件原始名：{{ selectedFile.origin_name }}</p>
                <n-divider />
                <p>文件大小：{{ selectedFile.size && convertFileSize(Number(selectedFile.size), true) }}</p>
                <n-divider />
                <p>文件指纹：{{ selectedFile.id }}</p>
            </div>
            <div class="w70 image-info">
                <p>上传时间：{{ format(new Date(selectedFile.time), 'yyyy年MM月dd日 HH:mm:ss') }}</p>
                <n-divider />
                <p>文件类型：{{ selectedFile.mimetype }}</p>
                <n-divider />
                <p>是否公开：{{ selectedFile.isPublic ? '公开' : '私有' }}</p>
                <n-divider />
                <p>存储策略：{{ findStrategiesNameById(selectedFile.strategies) }}</p>
            </div>
        </n-flex>
    </n-modal>
</template>

<style scoped>
:deep(.n-image)>img {
    @apply !object-cover;
}

.image-info>p {
    @apply text-sm text-[#666] text-overflow;
}

.image-info> :deep(.n-divider):not(.n-divider--vertical) {
    @apply !my;
}
</style>../../SettingsPanel/utils