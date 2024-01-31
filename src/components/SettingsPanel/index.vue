<script setup lang="ts">
import { FormInst, FormRules } from 'naive-ui';
import { useAppStore } from '~/store';
import { limitFunctionCallFrequency } from '~/utils/throttle';
import * as validate from '~/utils/validate';
import { checkConfiguration, getImgLinkFormat, getImgLinkFormatTabs } from './utils';

interface FormItemRule {
    required?: boolean;
    message?: string;
    trigger?: string | string[];
    validator?: (_: any, value: string) => Promise<void>;
}

const appStore = useAppStore();
const { isSettingsDrawer, apiUrl, token, bgImgUrl, strategies, strategiesVal, imgLinkFormatVal, recordSavePath } = storeToRefs(appStore);
const message = useMessage();
const settingsFormRef = ref<FormInst | null>(null);
const strategiesDisabled = ref(true);
const isStrategiesSyncBtnLoading = ref(false);

if (strategies.value.length === 0) {
    strategiesDisabled.value = true;
} else {
    strategiesDisabled.value = false;
}

checkConfiguration();

const settingsFormModel = ref({
    apiUrl: apiUrl.value || '',
    token: token.value || '',
    recordSavePath: recordSavePath.value || '',
    bgImgUrl: bgImgUrl.value || '',
    strategiesVal: strategiesVal.value || null,
    imgLinkFormatVal: imgLinkFormatVal.value || [],
});

// 表单验证规则
const createFormRule = (validator: (value: any) => boolean | Error): FormItemRule => {
    return {
        required: true,
        validator: async (_: any, value: any) => {
            const result = validator(value);
            if (result instanceof Error) {
                throw result.message;
            }
        },
        trigger: ['input', 'blur', 'change']
    };
};

// 表单验证规则
const settingsFormRules: FormRules = {
    apiUrl: createFormRule(() => validate.validateUrl(settingsFormModel.value.apiUrl)),
    token: createFormRule(() => validate.validateToken(settingsFormModel.value.token)),
    recordSavePath: createFormRule(() => validate.validateLogPath(settingsFormModel.value.recordSavePath)),
    bgImgUrl: createFormRule(() => validate.validateBgImgUrl(settingsFormModel.value.bgImgUrl)),
    strategiesVal: createFormRule(() => strategiesDisabled.value === false ? validate.validateStrategiesVal(settingsFormModel.value.strategiesVal) : true),
    imgLinkFormatVal: createFormRule(() => validate.validateImgLinkFormatVal(settingsFormModel.value.imgLinkFormatVal)),
};

// 处理表单验证的异步函数
const handleFormValidation = (onSuccess: () => void, onError: () => void) => {
    settingsFormRef.value?.validate((errors) => {
        if (!errors) {
            onSuccess();
        } else {
            onError();
        }
    });
}

// 选择路径的函数
const selectPath = () => {
    window.ipcRenderer.send('open-directory-dialog', 'openDirectory');
    window.ipcRenderer.on('selectedPath', (_e, files) => {
        settingsFormModel.value.recordSavePath = files;
    });
};

// 处理保存设置的异步函数
const handleSaveSettings = (e: MouseEvent) => {
    e.preventDefault();

    handleFormValidation(() => {
        const { apiUrl, token, bgImgUrl, strategiesVal, imgLinkFormatVal, recordSavePath } = settingsFormModel.value;

        if (!strategiesDisabled) {
            appStore.setState({ strategiesVal: Number(strategies.value[0].value) });
        }

        appStore.setState({
            apiUrl,
            token,
            bgImgUrl,
            isSettingsDrawer: false,
            strategiesVal: Number(strategiesVal),
            imgLinkFormatVal,
            recordSavePath,
        });
        message.success('保存成功');

    }, () => {
        message.error('保存失败，请检查配置项是否正确！');
    });
}
// 处理取消设置的事件
const handleCancelSettings = (e: MouseEvent) => {
    e.preventDefault();
    handleFormValidation(() => {
        appStore.setState({ isSettingsDrawer: false });
    }, () => {
        message.error('关闭失败，请检查配置项是否正确！');
    });
}

// 处理同步存储策略的异步函数
const handleSyncStrategies = limitFunctionCallFrequency(async () => {
    strategiesDisabled.value = true;
    isStrategiesSyncBtnLoading.value = true;

    if (await appStore.getStrategies()) {
        strategiesDisabled.value = false;
        isStrategiesSyncBtnLoading.value = false;
    }
}, { value: 1, unit: '小时' });


// 监听apiUrl和token的变化，如果有变化就重新获取所有数据
watch([apiUrl, token], async () => {
    appStore.getApiUrlTitle();
    appStore.getUserProfile();
    if (await appStore.getStrategies()) {
        strategiesDisabled.value = false;
    }
});

// 监听imgLinkFormatVal的变化，如果有变化就重新调用getImgLinkFormatTabs
watch(imgLinkFormatVal, () => {
    appStore.setState({ imgLinkFormatTabs: getImgLinkFormatTabs() });
}, { immediate: true });
</script>

<template>
    <n-drawer v-model:show="isSettingsDrawer" :width="502" :close-on-esc="false" :mask-closable="false"
        :on-mask-click="handleCancelSettings">
        <n-drawer-content title="设置">
            <n-form ref="settingsFormRef" v-model="settingsFormModel" :rules="settingsFormRules">
                <n-form-item label="API 地址" path="apiUrl">
                    <div class="flex-col wh-full">
                        <n-input v-model:value="settingsFormModel.apiUrl" placeholder="请填写API地址" @keydown.enter.prevent />
                        <n-tag :bordered="false" class="mt2">
                            <n-descriptions label-placement="left" class="text-xs">
                                <n-descriptions-item label="示例">
                                    https://example.com (必须包含http://或https://)
                                </n-descriptions-item>
                            </n-descriptions>
                        </n-tag>
                    </div>
                </n-form-item>
                <n-form-item label="Token" path="token">
                    <div class="flex-col wh-full">
                        <n-input v-model:value="settingsFormModel.token" placeholder="请填写Token" @keydown.enter.prevent />
                        <n-tag :bordered="false" class="mt2">
                            <n-descriptions label-placement="left" class="text-xs">
                                <n-descriptions-item label="示例">
                                    1|1bJbwlqBfnggmOMEZqXT5XusaIwqiZjCDs7r1Ob5
                                </n-descriptions-item>
                            </n-descriptions>
                        </n-tag>
                    </div>
                </n-form-item>
                <n-form-item label="存储策略" path="strategiesVal">
                    <div class="flex-col wh-full">
                        <div class="flex">
                            <n-select v-model:value="settingsFormModel.strategiesVal" placeholder="请选择存储策略"
                                :disabled="strategiesDisabled" :options="strategies" />
                            <n-button tertiary circle class="ml1" @click="handleSyncStrategies"
                                :disabled="strategiesDisabled">
                                <template #icon>
                                    <div
                                        :class="{ 'i-tabler-refresh text-dark-50': true, '!i-eos-icons-loading': isStrategiesSyncBtnLoading }">
                                    </div>
                                </template>
                            </n-button>
                        </div>
                        <n-tag :bordered="false" class="mt2">
                            <n-descriptions label-placement="left" class="text-xs">
                                <n-descriptions-item label="提示">
                                    请在API地址和Token填写完成保存后，再来选择存储策略
                                </n-descriptions-item>
                            </n-descriptions>
                        </n-tag>
                    </div>
                </n-form-item>
                <n-form-item label="上传记录文件路径" path="recordSavePath">
                    <div class="flex-col wh-full">
                        <n-input-group>
                            <n-input v-model:value="settingsFormModel.recordSavePath" placeholder="请选择上传记录文件存储路径"
                                @keydown.enter.prevent />
                            <n-button ghost @click="selectPath">
                                选择路径
                            </n-button>
                        </n-input-group>
                        <n-tag :bordered="false" class="mt2">
                            <n-descriptions label-placement="left" class="text-xs">
                                <n-descriptions-item label="提示">
                                    请选择上传记录文件要保存在哪个文件夹下
                                </n-descriptions-item>
                            </n-descriptions>
                        </n-tag>
                    </div>
                </n-form-item>
                <n-divider title-placement="left">
                    界面设置
                </n-divider>
                <n-form-item label="背景图地址" path="bgImgUrl">
                    <n-input v-model:value="settingsFormModel.bgImgUrl" placeholder="请填写背景图地址" @keydown.enter.prevent />
                </n-form-item>
                <n-form-item label="链接展示格式" path="imgLinkFormatVal">
                    <div class="flex-col wh-full">
                        <n-select v-model:value="settingsFormModel.imgLinkFormatVal" placeholder="请选择要展示什么格式的链接" multiple
                            :options="getImgLinkFormat" />
                        <n-tag :bordered="false" class="mt2">
                            <n-descriptions label-placement="left" class="text-xs">
                                <n-descriptions-item label="提示">
                                    请选择上传图片后展示什么格式的链接
                                </n-descriptions-item>
                            </n-descriptions>
                        </n-tag>
                    </div>
                </n-form-item>
                <n-button type="primary" @click="handleSaveSettings">
                    保存设置
                </n-button>
                <n-button class="ml5" @click="handleCancelSettings">
                    取消设置
                </n-button>
            </n-form>
        </n-drawer-content>
    </n-drawer>
</template>