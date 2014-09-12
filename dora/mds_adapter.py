import sys, urllib2
from .models import Patient, Disease

def main(argv):
    
    url = r'http://loaskjwhvfwkjhev'
    response = urllib2.urlopen(url).read()

    if response.status == 'SUCCESS':
        subjects = get_subjects(response.message)
        diseases = get_diseases(response.message)
        populate_database(subjects, diseases)
    
    return 0
    
if __name__ == "__main__":
    main(sys.argv)
    
def get_subjects(list):
    pass

def get_diseases(list):
    pass

def populate_database(subjects, diseases):
    pass
