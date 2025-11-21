// src/themes/theme.service.ts
import * as fs from 'fs';
import * as path from 'path';

// Определяем допустимые имена тем
export type CvTheme = 'classic' | 'modern' | 'minimal';

/**
 * Читает CSS-файл с темой из папки themes.
 * @param themeName Название темы (например, 'classic')
 * @returns Содержимое CSS-файла в виде строки
 */
export function getThemeCss(themeName: CvTheme): string {
    const fileName = `${themeName}.css`;
    
    // 1. Определяем базовый путь к папке themes.
    // __dirname указывает на текущую папку (src/themes в разработке, dist/themes в сборке).
    // Мы переходим на один уровень вверх (..) и ищем папку 'themes'.
    // В NestJS это может требовать настройки "assets" или "static" в nest-cli.json, 
    // чтобы файлы *.css копировались в папку dist.
    const themesDir = path.join(__dirname, '..', 'themes');
    const themePath = path.join(themesDir, fileName);

    try {
        if (!fs.existsSync(themePath)) {
            // Если файл не найден, логируем и используем тему по умолчанию
            console.warn(`Theme file not found at: ${themePath}. Using default 'classic'.`);
            
            // Если запрошенной темы нет, но это не 'classic', пробуем 'classic'
            if (themeName !== 'classic') {
                 return getThemeCss('classic');
            }
            // Если даже 'classic' не нашли, возвращаем пустую строку
            return ''; 
        }

        return fs.readFileSync(themePath, 'utf8');

    } catch (error) {
        console.error(`Error reading theme file ${fileName}:`, error);
        return '';
    }
}