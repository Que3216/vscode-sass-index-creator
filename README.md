## index.scss creator

If you create a new `index.scss` or `index.sass` it'll automatically import every SASS file in the directory, and any index.sass files from any sub-directories.

For example if you have the file tree:

```
root:
    file1.scss
    file2.scss
    sub-component:
        index.scss
        file3.scss
```

And you create an `index.scss` file in the root directory then this plugin will pre-populate the file with:

```
@import "file1";
@import "file2";
@import "sub-component/index";
```
