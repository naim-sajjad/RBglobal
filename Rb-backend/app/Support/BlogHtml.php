<?php

namespace App\Support;

use DOMDocument;
use DOMElement;
use DOMNode;

class BlogHtml
{
    public static function clean(string $html): string
    {
        $document = new DOMDocument();
        $previous = libxml_use_internal_errors(true);
        $document->loadHTML('<?xml encoding="UTF-8"><body>'.$html.'</body>', LIBXML_NONET);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);
        $body = $document->getElementsByTagName('body')->item(0);
        if (! $body) {
            return '';
        }
        self::cleanChildren($body);
        return implode('', array_map(fn ($node) => $document->saveHTML($node), iterator_to_array($body->childNodes)));
    }

    private static function cleanChildren(DOMNode $parent): void
    {
        foreach (iterator_to_array($parent->childNodes) as $node) {
            if (! $node instanceof DOMElement) {
                if ($node->nodeType !== XML_TEXT_NODE) {
                    $parent->removeChild($node);
                }
                continue;
            }
            $tag = strtolower($node->tagName);
            if (in_array($tag, ['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math', 'form', 'input', 'button', 'template'], true)) {
                $parent->removeChild($node);
                continue;
            }
            self::cleanChildren($node);
            if (! in_array($tag, ['p', 'div', 'br', 'h1', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'span', 'font', 'a', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'img'], true)) {
                while ($node->firstChild) {
                    $parent->insertBefore($node->firstChild, $node);
                }
                $parent->removeChild($node);
                continue;
            }
            foreach (iterator_to_array($node->attributes) as $attribute) {
                $name = strtolower($attribute->name);
                $value = trim($attribute->value);
                $safe = false;
                if (($tag === 'a' && $name === 'href') || ($tag === 'img' && $name === 'src')) {
                    $safe = preg_match('~^https?://[^\s]+$~i', $value) || preg_match('~^/(?!/)[^\s\\\\]*$~', $value);
                    if ($tag === 'a') {
                        $safe = $safe || preg_match('~^(mailto:|#)[^\s]+$~i', $value);
                    }
                } elseif (in_array($name, ['alt', 'title'], true)) {
                    $safe = true;
                } elseif ($name === 'color' && $tag === 'font') {
                    $safe = preg_match('/^(#[0-9a-f]{3,8}|[a-z]+)$/i', $value);
                } elseif ($name === 'size' && $tag === 'font') {
                    $safe = preg_match('/^[1-7]$/', $value);
                } elseif ($name === 'style') {
                    $styles = [];
                    foreach (explode(';', $value) as $declaration) {
                        $pair = explode(':', $declaration, 2);
                        if (count($pair) !== 2) continue;
                        [$property, $setting] = array_map('trim', $pair);
                        $valid = match (strtolower($property)) {
                            'color', 'background-color' => preg_match('/^(#[0-9a-f]{3,8}|[a-z]+|rgba?\([\d.,%\s]+\))$/i', $setting),
                            'text-align' => in_array($setting, ['left', 'center', 'right', 'justify'], true),
                            'font-size' => preg_match('/^(1[0-9]|[2-6][0-9]|7[0-2])px$/', $setting),
                            'line-height' => preg_match('/^[12](\.\d{1,2})?$/', $setting),
                            'margin-left' => preg_match('/^\d{1,3}px$/', $setting),
                            default => false,
                        };
                        if ($valid) $styles[] = strtolower($property).':'.$setting;
                    }
                    $node->setAttribute('style', implode(';', $styles));
                    $safe = count($styles) > 0;
                }
                if (! $safe) $node->removeAttribute($name);
            }
        }
    }
}
