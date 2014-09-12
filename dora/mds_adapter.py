import urllib2, sys, psycopg2, settings


def main(argv):
    
    database = setting.default
    try:
        setting_parameters = "dbname='%s' user='%s' host='%s' password='%s'" % (database.NAME, database.USER, 
                                                                                database.HOST, database.PASSWORD)
        conn = psycopg2.connect(setting_parameters)
    except:
        print "Error: Cannot connect to the database."
        sys.exit(0)
    
    url = r'http://loaskjwhvfwkjhev'
    response = urllib2.urlopen(url).read()

    if response.status == 'SUCCESS':
        subjects = get_subjects(response.message)
        diseases = get_diseases(response.message)
        populate_database(subjects, diseases, con)
    
    return 0
    
if __name__ == "__main__":
    main(sys.argv)
    
def get_subjects(list):
    pass

def get_diseases(list):
    pass

def populate_database(subjects, diseases, db):
    pass
