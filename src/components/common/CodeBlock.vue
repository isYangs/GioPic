<script setup lang="ts">
import { unescapeHtml } from '~/utils/escape';

const props = defineProps({
    type: {
        type: String,
        required: true,
        default: 'text'
    },
    code: {
        type: String,
        required: true,
    }
});

const message = useMessage();

// 复制代码到剪切板
const copyCode = () => {
    const codeToCopy = unescapeHtml(props.code);
    navigator.clipboard.writeText(codeToCopy).then(() => {
        message.success('复制成功');
    }).catch(() => {
        message.error('复制失败');
    });
};
</script>

<template>
    <div v-highlight class="relative">
        <pre><code class="cursor-text select-text" :class="`language-${type}`">{{ unescapeHtml(code) }}</code></pre>
        <n-button quaternary class="w5 h5 absolute top-1 right-0" @click="copyCode">
            <template #icon>
                <div class="i-gg-copy text-light-50 w4 h4"></div>
            </template>
        </n-button>
    </div>
</template>

<style scoped>
:deep(code.hljs) {
    @apply rounded-2;
}

:deep(code.hljs)::-webkit-scrollbar-thumb {
    @apply bg-white op-50;
}
</style>