export const getCurrentTemplate = (templates, emailCount) => {
    if (!templates || templates.length === 0) {
        throw new Error('No templates available');
    }
    const index = Math.floor(emailCount / 50) % templates.length;
    return templates[index];
};

export const delay = async (minMs = 1000, maxMs = 5000) => {
    const delayTime = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    await new Promise(resolve => setTimeout(resolve, delayTime));
};