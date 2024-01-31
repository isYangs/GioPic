<script setup lang="ts">

</script>

<template>
    <n-config-provider>
        <n-message-provider>
            <n-dialog-provider>
                <slot />
            </n-dialog-provider>
        </n-message-provider>
    </n-config-provider>
</template>