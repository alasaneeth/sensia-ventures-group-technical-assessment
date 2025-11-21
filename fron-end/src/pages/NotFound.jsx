import { useNavigate } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";
import { Button } from "antd";

function NotFound() {
    const navigate = useNavigate();
    return (
        <>
            <PageHeader title={"Page Not Found"} />
            <div style={{backgroundColor: '#ff22006b', padding: '1rem', borderRadius: "0.5rem"}}>
                <h1 style={{fontSize: '1.3rem', marginBottom: "1rem", color: '#a72814'}}>Sorry. The page you are trying to access isn't found</h1>
                <Button onClick={() => navigate(-1, {replace: true})}>Go Back</Button>
            </div>
        </>
    );
}

export default NotFound;