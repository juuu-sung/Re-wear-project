module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          alias: {
            "@": "./app", // ✅ "@/"는 "app/" 폴더를 의미
          },
        },
      ],
    ],
  };
};
