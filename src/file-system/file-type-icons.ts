export const getIconUrl = (path: string, isDir: boolean) => {
    return `https://raw.githubusercontent.com/vscode-icons/vscode-icons/master/icons/${getIconName(
        path,
        isDir
    )}.svg`;
};

function getIconName(path: string, isDir: boolean) {
    if (!path) return "default_file";
    if (isDir) return "default_folder";
    const filename = path.substring(path.lastIndexOf("/") + 1);
    const ext = filename.split(".").pop() || "";
    return (
        getIconNameFromExtension(ext) ||
        getIconNameFromFileName(filename) ||
        "default_file"
    );
}

function getIconNameFromExtension(ext: string) {
    switch (ext.toLowerCase()) {
        case "js":
            return "file_type_js";
        case "ts":
            return "file_type_typescript";
        case "html":
            return "file_type_html";
        case "css":
            return "file_type_css";
        case "less":
            return "file_type_less";
        case "sass":
            return "file_type_sass";
        case "scss":
            return "file_type_scss";
        case "json":
            return "file_type_json";
        case "py":
            return "file_type_python";
        case "rb":
            return "file_type_ruby";
        case "go":
            return "file_type_go";
        case "rust":
            return "file_type_rust";
        case "java":
            return "file_type_java";
        case "scala":
            return "file_type_scala";
        case "swift":
            return "file_type_swift";
        case "sh":
            return "file_type_shell";
        case "makefile":
            return "file_type_shell";
        case "bat":
            return "file_type_shell";
        case "bash":
            return "file_type_shell";
        case "cs":
            return "file_type_csharp";
        case "yml":
            return "file_type_yaml";
        case "yaml":
            return "file_type_yaml";
        case "xml":
            return "file_type_xml";
        case "md":
            return "file_type_markdown";
        case "sql":
            return "file_type_sql";
        case "jpg":
            return "file_type_image";
        case "svg":
            return "file_type_image";
        case "jpeg":
            return "file_type_image";
        case "png":
            return "file_type_image";
        case "gif":
            return "file_type_image";
        case "bmp":
            return "file_type_image";
        default:
            return null;
    }
}

function getIconNameFromFileName(filename: string) {
    switch (filename.toLowerCase()) {
        case "dockerfile":
            return "file_type_docker";
        case ".gitignore":
            return "file_type_git2";
        case ".gitattributes":
            return "file_type_git2";
        default:
            return null;
    }
}
