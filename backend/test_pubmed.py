import requests
import json
import xml.etree.ElementTree as ET
from urllib.parse import urlencode
import sys

def test_pubmed_search(query="covid diagnosis"):
    try:
        print(f"\n=== Testing PubMed search for: {query} ===\n")
        
        # First request to get IDs
        search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
        search_params = {
            "db": "pubmed",
            "term": query,
            "retmax": "10",
            "retmode": "json",
            "usehistory": "y",
            "sort": "relevance",
            "field": "title/abstract"
        }
        
        print(f"Making search request to URL: {search_url}?{urlencode(search_params)}")
        response = requests.get(search_url, params=search_params)
        response.raise_for_status()
        print(f"Search Status: {response.status_code}")
        
        data = response.json()
        print("\nSearch Response Body:")
        print(json.dumps(data, indent=2))
        
        # Get the IDs
        ids = data['esearchresult']['idlist']
        count = data['esearchresult']['count']
        print(f"\nTotal results found: {count}")
        print(f"IDs returned: {len(ids)}")
        print(f"IDs: {ids}")
        
        if len(ids) < 10:
            print("\nWARNING: Received fewer than 10 IDs!")
        
        # Second request to get full articles
        fetch_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
        fetch_params = {
            "db": "pubmed",
            "id": ",".join(ids),
            "retmode": "xml",
            "rettype": "abstract"
        }
        
        print(f"\nMaking fetch request to URL: {fetch_url}?{urlencode(fetch_params)}")
        response = requests.get(fetch_url, params=fetch_params)
        response.raise_for_status()
        print(f"Fetch Status: {response.status_code}")
        
        # Try parsing the XML
        root = ET.fromstring(response.text)
        articles = root.findall(".//PubmedArticle")
        print(f"\nFound {len(articles)} articles in XML")
        
        if len(articles) != len(ids):
            print(f"\nWARNING: Number of articles ({len(articles)}) doesn't match number of IDs ({len(ids)})!")
        
        # Print details for each article
        for i, article in enumerate(articles, 1):
            try:
                pmid = article.find(".//PMID").text if article.find(".//PMID") is not None else "No PMID"
                title = article.find(".//ArticleTitle").text if article.find(".//ArticleTitle") is not None else "No title"
                print(f"\nArticle {i}:")
                print(f"PMID: {pmid}")
                print(f"Title: {title}")
                
                # Get abstract
                abstract_elements = article.findall(".//Abstract/AbstractText")
                if abstract_elements:
                    abstract = " ".join(elem.text for elem in abstract_elements if elem.text)
                    print(f"Abstract length: {len(abstract)} characters")
                else:
                    print("No abstract available")
                
                # Get authors
                authors = []
                for author in article.findall(".//Author"):
                    lastname = author.find("LastName")
                    forename = author.find("ForeName")
                    if lastname is not None and forename is not None:
                        authors.append(f"{forename.text} {lastname.text}")
                if authors:
                    print(f"Authors: {', '.join(authors[:3])}{'...' if len(authors) > 3 else ''}")
                
                # Get DOI and PMCID
                doi = None
                pmcid = None
                for id_elem in article.findall(".//ArticleId"):
                    if id_elem.get("IdType") == "doi":
                        doi = id_elem.text
                    elif id_elem.get("IdType") == "pmc":
                        pmcid = id_elem.text
                print(f"DOI: {doi}")
                print(f"PMCID: {pmcid}")
                
                # Check publication type
                pub_types = article.findall(".//PublicationType")
                if pub_types:
                    print("Publication Types:", ", ".join(pt.text for pt in pub_types if pt.text))
                
            except Exception as e:
                print(f"Error processing article {i}: {e}")
                continue
            
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        raise

if __name__ == "__main__":
    # Test with different queries
    queries = [
        "covid diagnosis",
        "tb diagnosis",
        "cancer screening",
        "diabetes treatment"
    ]
    
    for query in queries:
        try:
            test_pubmed_search(query)
            print("\n" + "="*80 + "\n")
        except Exception as e:
            print(f"Failed testing query '{query}': {e}", file=sys.stderr) 