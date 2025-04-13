#!/usr/bin/env python3
"""
URL Encoder - HTML Entity Encoding

This script encodes URLs by converting each character to its HTML entity representation.
"""

def encode_html_entities(url: str) -> str:
    """
    Encode a URL by converting each character to its HTML entity representation.
    
    Args:
        url (str): The URL to encode
        
    Returns:
        str: The encoded URL with HTML entities
    """
    return ''.join(f'&#{ord(char)};' for char in url)

if __name__ == "__main__":
    url = input("copy encoded url to insert in html ")
    encoded_url = encode_html_entities(url)
    print(encoded_url)
